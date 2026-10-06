export type ApiErrorPayload = {
  detail?: string;
  message?: string;
  errors?: Record<string, string | string[]>;
};

export const AUTH_SESSION_EXPIRED_EVENT = 'solobuild:session-expired';
const TOKEN_KEY = 'solobuildai_auth_tokens';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/+$/, '');

export const readAuthTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
};

export const persistAuthTokens = (tokens: AuthTokens) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
};

export const clearAuthTokens = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
};

export const emitAuthSessionExpired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
  }
};

const getRefreshToken = (): string | null => readAuthTokens()?.refresh_token ?? null;

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuthTokens();
      emitAuthSessionExpired();
      return null;
    }

    const payload = await response.json() as AuthTokens;
    const nextTokens = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token ?? refreshToken,
      token_type: payload.token_type ?? 'bearer',
    };
    persistAuthTokens(nextTokens);
    return nextTokens.access_token;
  } catch {
    clearAuthTokens();
    emitAuthSessionExpired();
    return null;
  }
};

export async function apiRequest<T>(path: string, options: RequestInit = {}, retry = false): Promise<T> {
  const headers = new Headers(options.headers || {});
  const authTokens = readAuthTokens();

  if (authTokens?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authTokens.access_token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !retry) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      headers.set('Authorization', `Bearer ${refreshedToken}`);
      return apiRequest<T>(path, { ...options, headers }, true);
    }

    const message = 'Your session has expired. Please log in again.';
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const detail =
      payload?.detail ||
      payload?.message ||
      (typeof payload?.errors === 'object' ? Object.values(payload.errors).flat().join(', ') : null) ||
      'Something went wrong.';

    throw new Error(detail);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

export const apiJson = <T>(path: string, method: string, body?: unknown, headers?: Record<string, string>) =>
  apiRequest<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      ...(headers || {}),
      Accept: 'application/json',
    },
  });
