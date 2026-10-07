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
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!res.ok) {
    let errorDetail = '';
    if (isJson) {
      try {
        const err = await res.json();
        if (typeof err === 'object' && err !== null) {
          if (err.detail) {
            errorDetail = String(err.detail);
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
        // Fallback gracefully if error body is not valid JSON
      }
    }

    if (res.status === 400 || res.status === 401) {
      if (errorDetail && errorDetail.toLowerCase().includes('credential')) {
        throw new Error('Invalid email or password.');
      }
      throw new Error(errorDetail || 'Invalid email or password.');
    } else if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('Unable to connect to Vizzy. Please try again.');
    } else if (res.status >= 500) {
      throw new Error('Something went wrong on our server. Please try again.');
    } else {
      throw new Error(errorDetail || 'Unable to complete sign in right now. Please try again.');
    }
  }

  if (res.status === 204) {
    return {} as T;
  }

  if (!isJson) {
    console.warn(`[authApi] Expected JSON response but received: ${contentType}`);
    throw new Error('Unable to complete sign in right now. Please try again.');
  }

  try {
    return await res.json();
  } catch (err) {
    console.warn('[authApi] Failed to parse JSON response:', err);
    throw new Error('Unable to complete sign in right now. Please try again.');
  }
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
