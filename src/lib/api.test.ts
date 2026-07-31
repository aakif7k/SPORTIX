/**
 * Behavioural tests for the API client.
 *
 * These cover the four defects the previous client shipped with, each of which
 * failed silently rather than loudly:
 *   F1  a JWT read once from localStorage and never refreshed, so every request
 *       started 401ing fifteen minutes after sign-in
 *   F2  a hard 3000 ms abort on every call, including uploads
 *   F3  no 401 retry, and `signal: options.signal || controller.signal`, which
 *       meant passing a signal silently disabled the timeout
 *   —   errors flattened to Error(message), losing status, code and request id
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createJWT = vi.fn();
vi.mock('@/lib/appwrite', () => ({
  account: { createJWT: () => createJWT() },
}));

/** A JWT whose exp claim is `secondsFromNow` in the future. */
function makeJwt(secondsFromNow: number, tag = 'a'): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + secondsFromNow, tag };
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;
let api: typeof import('@/lib/api').api;
let ApiError: typeof import('@/lib/api').ApiError;
let getJWT: typeof import('@/lib/api').getJWT;
let clearJWT: typeof import('@/lib/api').clearJWT;
let SESSION_EXPIRED_EVENT: string;

beforeEach(async () => {
  vi.resetModules();
  createJWT.mockReset();
  createJWT.mockResolvedValue({ jwt: makeJwt(900) });

  fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: {} }));
  vi.stubGlobal('fetch', fetchMock);

  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn(), addEventListener: vi.fn() });

  const mod = await import('@/lib/api');
  api = mod.api;
  ApiError = mod.ApiError;
  getJWT = mod.getJWT;
  clearJWT = mod.clearJWT;
  SESSION_EXPIRED_EVENT = mod.SESSION_EXPIRED_EVENT;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const authHeader = (call: number) =>
  (fetchMock.mock.calls[call][1].headers as Record<string, string>).Authorization;

describe('JWT handling (F1)', () => {
  it('mints a token on the first request and sends it as a bearer', async () => {
    await api.get('/api/users/me');
    expect(createJWT).toHaveBeenCalledTimes(1);
    expect(authHeader(0)).toMatch(/^Bearer /);
  });

  it('reuses a cached token instead of minting per request', async () => {
    await api.get('/a');
    await api.get('/b');
    await api.get('/c');
    expect(createJWT).toHaveBeenCalledTimes(1);
  });

  it('refreshes a token that is within the 60s margin of expiry', async () => {
    createJWT.mockResolvedValueOnce({ jwt: makeJwt(30, 'stale') });
    await api.get('/a');                       // caches a token expiring in 30s
    createJWT.mockResolvedValueOnce({ jwt: makeJwt(900, 'fresh') });
    await api.get('/b');                       // must not reuse it
    expect(createJWT).toHaveBeenCalledTimes(2);
  });

  it('mints once for a burst of concurrent requests', async () => {
    await Promise.all([api.get('/a'), api.get('/b'), api.get('/c'), api.get('/d')]);
    expect(createJWT).toHaveBeenCalledTimes(1);
  });

  it('sends no Authorization header when there is no session', async () => {
    createJWT.mockRejectedValue(new Error('no session'));
    await api.get('/api/posts/feed');
    expect(authHeader(0)).toBeUndefined();
  });

  it('reads expiry from the token rather than assuming a fixed lifetime', async () => {
    createJWT.mockResolvedValueOnce({ jwt: makeJwt(3600) });
    await getJWT();
    createJWT.mockClear();
    await getJWT();
    expect(createJWT).not.toHaveBeenCalled();   // still valid, so no refresh
  });
});

describe('401 handling (F3)', () => {
  it('refreshes and retries exactly once', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: { code: 'UNAUTHENTICATED', message: 'expired' } }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'u1' } }));

    const out = await api.get<{ data: { id: string } }>('/api/users/me');
    expect(out.data.id).toBe('u1');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(createJWT).toHaveBeenCalledTimes(2);      // the retry used a new token
  });

  it('gives up after one retry and announces the dead session', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(401, { success: false, error: { code: 'UNAUTHENTICATED', message: 'gone' } }),
    );
    await expect(api.get('/api/users/me')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);      // never loops
    const dispatch = (globalThis as unknown as { window: { dispatchEvent: ReturnType<typeof vi.fn> } })
      .window.dispatchEvent;
    expect(dispatch).toHaveBeenCalled();
    expect(dispatch.mock.calls[0][0].type).toBe(SESSION_EXPIRED_EVENT);
  });

  it('does not retry a 403, which is a permission problem not a stale token', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { success: false, error: { code: 'FORBIDDEN', message: 'not yours' } }),
    );
    await expect(api.delete('/api/posts/x')).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('timeouts and signals (F2, F3)', () => {
  it('aborts a hanging request and reports a timeout', async () => {
    fetchMock.mockImplementation((_u: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new Error('aborted')));
      }),
    );
    const err: unknown = await api.get('/slow', { timeoutMs: 20 }).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as InstanceType<typeof ApiError>).isTimeout).toBe(true);
  });

  it('passes no signal when the timeout is disabled, so uploads can run long', async () => {
    await api.upload('/api/upload/avatar', new FormData());
    expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
  });

  it('honours a caller signal WITHOUT discarding the timeout', async () => {
    // The old client did `options.signal || controller.signal`, so supplying a
    // signal removed the timeout entirely. Both must be live at once.
    fetchMock.mockImplementation((_u: string, init: RequestInit) =>
      new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new Error('aborted')));
      }),
    );
    const caller = new AbortController();
    const err: unknown = await api.get('/slow', { timeoutMs: 20, signal: caller.signal }).catch(e => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as InstanceType<typeof ApiError>).isTimeout).toBe(true);          // timeout still fired
  });

  it('rethrows a deliberate caller abort as-is, not as a failure', async () => {
    // Real fetch rejects straight away when handed an already-aborted signal, so
    // the fake has to as well: awaiting getJWT() gives the caller time to abort
    // before fetch is reached, and a listener-only mock would wait forever for an
    // event that already fired.
    fetchMock.mockImplementation((_u: string, init: RequestInit) => {
      if (init.signal?.aborted) {
        return Promise.reject(new DOMException('aborted', 'AbortError'));
      }
      return new Promise((_res, rej) => {
        init.signal?.addEventListener('abort', () => rej(new DOMException('aborted', 'AbortError')));
      });
    });
    const caller = new AbortController();
    const promise = api.get('/slow', { timeoutMs: 0, signal: caller.signal });
    caller.abort();
    const err = await promise.catch(e => e);
    expect(err).not.toBeInstanceOf(ApiError);  // a cancellation is not an error
    expect((err as DOMException).name).toBe('AbortError');
  });

  it('uses a 15s default rather than the old 3s', async () => {
    await api.get('/api/users/me');
    // The signal exists (a timeout is armed) but nothing aborted at 3s.
    expect(fetchMock.mock.calls[0][1].signal).toBeDefined();
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
  });
});

describe('typed errors', () => {
  it('carries status, code, details and the request id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(
      422,
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: [{ field: 'content' }] },
        request_id: 'abc123',
      },
      { 'X-Request-ID': 'abc123' },
    ));
    const err = await api.post('/api/posts/', {}).catch(e => e) as InstanceType<typeof ApiError>;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.requestId).toBe('abc123');
    expect(err.details).toEqual([{ field: 'content' }]);
  });

  it('classifies an unreachable server as a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await api.get('/api/users/me').catch(e => e) as InstanceType<typeof ApiError>;
    expect(err.isNetwork).toBe(true);
    expect(err.status).toBe(0);
  });

  it('survives a non-JSON error body', async () => {
    fetchMock.mockResolvedValue(new Response('<html>502</html>', {
      status: 502, headers: { 'content-type': 'text/html' },
    }));
    const err = await api.get('/api/users/me').catch(e => e) as InstanceType<typeof ApiError>;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
  });
});

describe('requests', () => {
  it('sets JSON content-type for a body but lets FormData set its own', async () => {
    await api.post('/a', { x: 1 });
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Content-Type'])
      .toBe('application/json');

    fetchMock.mockClear();
    await api.upload('/b', new FormData());
    expect((fetchMock.mock.calls[0][1].headers as Record<string, string>)['Content-Type'])
      .toBeUndefined();
  });

  it('clearJWT forces the next request to mint again', async () => {
    await api.get('/a');
    clearJWT();
    await api.get('/b');
    expect(createJWT).toHaveBeenCalledTimes(2);
  });
});
