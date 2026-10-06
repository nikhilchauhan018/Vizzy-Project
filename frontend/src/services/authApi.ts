/**
 * Authoritative Authentication API Client for Vizzy
 * Connects frontend directly to Django REST Framework accounts endpoints using Email & Full Name.
 */

export interface AuthUser {
  id: number | string;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const TOKEN_KEY = 'vizzy_auth_token';
const BASE_URL = (import.meta.env?.VITE_AUTH_API_BASE_URL as string) || '/api/auth';

let inMemoryToken: string | null = null;

export function getAuthToken(): string | null {
  try {
    const val = localStorage.getItem(TOKEN_KEY);
    if (val && val !== 'null' && val !== 'undefined' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {
    // In restrictive iframe environments, localStorage access might throw
  }
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token ? token.trim() : null;
  try {
    if (inMemoryToken) {
      localStorage.setItem(TOKEN_KEY, inMemoryToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Failed to update auth token in localStorage:', e);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function logAuthDebug(method: string, path: string) {
  if (import.meta.env?.DEV) {
    const token = getAuthToken();
    const hasToken = Boolean(token && token.length > 0);
    console.log(
      `AUTH DEBUG: method = ${method}, path = ${path}, hasAuthorizationHeader = ${hasToken}, hasToken = ${hasToken}`
    );
  }
}

async function handleAuthResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Authentication request failed (${res.status})`;
    try {
      const err = await res.json();
      if (typeof err === 'object' && err !== null) {
        if (err.detail) {
          errorDetail = err.detail;
        } else if (err.non_field_errors) {
          errorDetail = Array.isArray(err.non_field_errors)
            ? err.non_field_errors.join(' ')
            : String(err.non_field_errors);
        } else {
          const messages = Object.entries(err)
            .map(([field, msg]) => `${field}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
            .join('; ');
          if (messages) errorDetail = messages;
        }
      }
    } catch {
      // Fallback to HTTP status text
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const authApi = {
  async signup(data: {
    email: string;
    full_name: string;
    password: string;
  }): Promise<AuthResponse> {
    logAuthDebug('POST', `${BASE_URL}/signup/`);
    const res = await fetch(`${BASE_URL}/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleAuthResponse<AuthResponse>(res);
    setAuthToken(result.token);
    return result;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    logAuthDebug('POST', `${BASE_URL}/login/`);
    const res = await fetch(`${BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleAuthResponse<AuthResponse>(res);
    setAuthToken(result.token);
    return result;
  },

  async logout(): Promise<void> {
    logAuthDebug('POST', `${BASE_URL}/logout/`);
    try {
      const headers = getAuthHeaders();
      await fetch(`${BASE_URL}/logout/`, {
        method: 'POST',
        headers,
      });
    } catch (e) {
      console.warn('Backend logout request failed, clearing local token:', e);
    } finally {
      setAuthToken(null);
    }
  },

  async getCurrentUser(): Promise<AuthUser> {
    const token = getAuthToken();
    logAuthDebug('GET', `${BASE_URL}/me/`);
    if (!token) {
      throw new Error('No authentication token found.');
    }
    const res = await fetch(`${BASE_URL}/me/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleAuthResponse<AuthUser>(res);
  },
};
