function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return envUrl || window.location.origin;
  }
  return envUrl || 'http://localhost:8000';
}
const BASE_URL = getBaseUrl();

function getJWT(): string {
  return localStorage.getItem('sportix_jwt') || '';
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const jwt = getJWT();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        ...options.headers,
      },
    });
    clearTimeout(timeoutId);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error?.message || `Request failed: ${res.status}`
      );
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('API request timed out (3s max)');
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const jwt = getJWT();
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
        // NO Content-Type — browser sets multipart boundary
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    return data;
  },
};