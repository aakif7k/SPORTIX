/**
 * The single HTTP client for the FastAPI backend.
 *
 * What was wrong with the version this replaces:
 *
 *  - getJWT() read a token out of localStorage synchronously and nothing ever
 *    refreshed it. Appwrite JWTs expire after 15 minutes, so every authenticated
 *    request began failing silently a quarter of an hour after sign-in, and the
 *    only cure a user had was a reload.
 *  - a hard 3000 ms AbortController wrapped every request, including avatar
 *    uploads and AI generation. A cold backend start or a large file was
 *    guaranteed to abort.
 *  - `signal: options.signal || controller.signal` meant that passing your own
 *    signal silently disabled the timeout entirely.
 *  - errors were flattened to `new Error(message)`, so callers could not tell a
 *    404 from a 500 from a network failure, and the backend's error code and
 *    request id were thrown away.
 */
import { account } from '@/lib/appwrite';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/** Appwrite's JWT lifetime. Do not raise this hoping for a longer token. */
const JWT_TTL_MS = 15 * 60 * 1000;
/** Refresh this far before expiry so a request in flight cannot straddle it. */
const REFRESH_MARGIN_MS = 60 * 1000;
const DEFAULT_TIMEOUT_MS = 15_000;

/** Dispatched when a refreshed token is still rejected. AuthContext listens. */
export const SESSION_EXPIRED_EVENT = 'sportix:session-expired';

/** The backend's failure envelope: {success:false, error:{...}, request_id}. */
export interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
  request_id?: string;
}

/**
 * A failed request, with everything a caller needs to react: the HTTP status,
 * the backend's stable error code, field-level details from a 422, and the
 * request id to quote in a bug report.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(args: {
    status: number; code: string; message: string;
    details?: unknown; requestId?: string; cause?: unknown;
  }) {
    super(args.message, { cause: args.cause });
    this.name = 'ApiError';
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.requestId = args.requestId;
  }

  /** True when the request never reached the server. */
  get isNetwork(): boolean {
    return this.status === 0 && this.code === 'NETWORK_ERROR';
  }

  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }

  get isAuth(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

// ─── JWT cache ────────────────────────────────────────────────────────────────
let cachedJwt: { token: string; expiresAt: number } | null = null;
/** Shared across concurrent callers so a burst of requests mints one token. */
let pendingMint: Promise<string> | null = null;

/** Read `exp` out of the token rather than trusting an assumed TTL. */
function expiryOf(token: string): number {
  try {
    const [, payload] = token.split('.');
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof claims.exp === 'number') return claims.exp * 1000;
  } catch {
    // Not a readable JWT; fall back to Appwrite's documented lifetime.
  }
  return Date.now() + JWT_TTL_MS;
}

export async function getJWT(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedJwt && Date.now() < cachedJwt.expiresAt - REFRESH_MARGIN_MS) {
    return cachedJwt.token;
  }
  if (pendingMint) return pendingMint;

  pendingMint = (async () => {
    try {
      const { jwt } = await account.createJWT();
      cachedJwt = { token: jwt, expiresAt: expiryOf(jwt) };
      // Mirrored to localStorage only so older code paths keep working; this
      // cache, not storage, is the source of truth.
      try { localStorage.setItem('sportix_jwt', jwt); } catch { /* private mode */ }
      return jwt;
    } catch {
      // No Appwrite session: the caller is anonymous, which is valid for
      // public endpoints. Requests simply go out without an Authorization header.
      clearJWT();
      return '';
    }
  })();

  try {
    return await pendingMint;
  } finally {
    pendingMint = null;
  }
}

export function clearJWT(): void {
  cachedJwt = null;
  try { localStorage.removeItem('sportix_jwt'); } catch { /* private mode */ }
}

// ─── Request ──────────────────────────────────────────────────────────────────
export interface RequestOptions extends Omit<RequestInit, 'signal'> {
  /** Milliseconds before the request is aborted. 0 disables the timeout. */
  timeoutMs?: number;
  /** Caller's own signal. Composed WITH the timeout, never replacing it. */
  signal?: AbortSignal | null;
  /** Internal: set on the single retry so a 401 loop is impossible. */
  _isRetry?: boolean;
}

/**
 * Combine the caller's signal with a timeout so either can abort the request.
 * The old code picked one or the other, which is how passing a signal disabled
 * the timeout.
 */
function composeSignal(
  timeoutMs: number,
  callerSignal: AbortSignal | null | undefined,
): { signal: AbortSignal | undefined; didTimeout: () => boolean } {
  const timeoutSignal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : null;
  const didTimeout = () => Boolean(timeoutSignal?.aborted);

  if (timeoutSignal && callerSignal) {
    return { signal: AbortSignal.any([timeoutSignal, callerSignal]), didTimeout };
  }
  return { signal: timeoutSignal ?? callerSignal ?? undefined, didTimeout };
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  if (!type.includes('application/json')) {
    const text = await res.text().catch(() => '');
    return text ? { _raw: text.slice(0, 500) } : null;
  }
  return res.json().catch(() => null);
}

function toApiError(status: number, body: unknown, requestId?: string): ApiError {
  const envelope = body as Partial<ApiErrorEnvelope> | null;
  const error = envelope?.error;
  return new ApiError({
    status,
    code: error?.code || `HTTP_${status}`,
    message: error?.message || `Request failed with status ${status}`,
    details: error?.details,
    requestId: envelope?.request_id || requestId,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, _isRetry, ...init } = options;

  const jwt = await getJWT();
  const { signal, didTimeout } = composeSignal(timeoutMs, callerSignal);

  const isFormData = init.body instanceof FormData;
  const headers: Record<string, string> = {
    // FormData must set its own Content-Type so the multipart boundary is right.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers, signal });
  } catch (cause) {
    if (didTimeout()) {
      throw new ApiError({
        status: 0, code: 'TIMEOUT',
        message: `Request timed out after ${timeoutMs} ms`,
        cause,
      });
    }
    if (callerSignal?.aborted) {
      // A deliberate cancellation, e.g. a component unmounting. Rethrow as-is so
      // callers can ignore it rather than surfacing it as a failure.
      throw cause;
    }
    throw new ApiError({
      status: 0, code: 'NETWORK_ERROR',
      message: 'Could not reach the server. Check your connection.',
      cause,
    });
  }

  const requestId = res.headers.get('X-Request-ID') || undefined;
  const body = await parseBody(res);

  if (res.status === 401 && !_isRetry) {
    // The token may simply have aged out. Mint a fresh one and try once more.
    clearJWT();
    const refreshed = await getJWT(true);
    if (refreshed) {
      return request<T>(path, { ...options, _isRetry: true });
    }
  }

  if (res.status === 401) {
    // A freshly minted token was still rejected, so the Appwrite session itself
    // is gone. Tell the app once; AuthContext signs the user out.
    clearJWT();
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    throw toApiError(res.status, body, requestId);
  }

  if (!res.ok) throw toApiError(res.status, body, requestId);

  return body as T;
}

// ─── Public surface ───────────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options, method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options, method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options, method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  /**
   * Multipart upload. No timeout by default: a video on a slow connection is a
   * legitimately long request, and the old client aborted every one at 3 s.
   */
  upload: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, { timeoutMs: 0, ...options, method: 'POST', body: formData }),
};

export default api;
