import { apiJson, apiRequest, clearAuthTokens, getApiBaseUrl, persistAuthTokens, readAuthTokens } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  timezone?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  timezone: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const result = await apiJson<{ user: AuthUser; access_token: string; refresh_token: string; token_type: 'bearer' }>(
      '/auth/register',
      'POST',
      payload,
      { 'Content-Type': 'application/json' },
    );

    persistAuthTokens({
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      token_type: result.token_type,
    });

    return result;
  },

  async login(email: string, password: string) {
    const form = new URLSearchParams({
      username: email,
      password,
    });

    const result = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!result.ok) {
      let payload: any = null;
      try {
        payload = await result.json();
      } catch {
        payload = null;
      }
      throw new Error(payload?.detail || 'Invalid email or password.');
    }

    const data = await result.json() as { access_token: string; refresh_token: string; token_type: 'bearer' };
    persistAuthTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
    });

    return data;
  },

  async getCurrentUser() {
    return apiRequest<AuthUser>('/auth/me', { method: 'GET' });
  },

  async refreshAccessToken() {
    const tokens = readAuthTokens();
    if (!tokens?.refresh_token) {
      throw new Error('Missing refresh token.');
    }

    const result = await apiJson<{ access_token: string; refresh_token: string; token_type: 'bearer' }>(
      '/auth/refresh',
      'POST',
      { refresh_token: tokens.refresh_token },
      { 'Content-Type': 'application/json' },
    );

    const nextTokens = {
      access_token: result.access_token,
      refresh_token: result.refresh_token ?? tokens.refresh_token,
      token_type: result.token_type,
    };
    persistAuthTokens(nextTokens);
    return nextTokens;
  },

  logout() {
    clearAuthTokens();
  },
};
