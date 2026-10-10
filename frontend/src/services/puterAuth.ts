/**
 * Puter AI Gateway Client Authentication & Session Helper.
 * Follows docs/PUTER_AI_GATEWAY_DIRECTION.md:
 * - Keeps Vizzy authentication and Puter authentication completely separate.
 * - Uses the official Puter SDK and documented temporary-user authentication flow.
 * - Starts interactive Puter onboarding from a legitimate user interaction when required.
 * - Passes X-Puter-Auth-Token to Django generation API.
 * - Never exposes credentials or tokens in logs or error messages.
 */

const PUTER_SESSION_TOKEN_KEY = 'vizzy_puter_session_token';

declare global {
  interface Window {
    puter?: any;
  }
}

export interface PuterUserState {
  isSignedIn: boolean;
  username?: string;
  hasToken: boolean;
}

export class PuterAuthError extends Error {
  code: string;
  constructor(message: string, code: string = 'PUTER_AUTH_ERROR') {
    super(message);
    this.name = 'PuterAuthError';
    this.code = code;
  }
}

export const puterAuth = {
  /**
   * Resolves the current Puter token from session storage, localStorage, or Puter window object.
   */
  getToken(): string | null {
    try {
      const sessionVal = sessionStorage.getItem(PUTER_SESSION_TOKEN_KEY);
      if (sessionVal && sessionVal.trim().length > 0) {
        return sessionVal.trim();
      }
    } catch {
      // Storage access may be restricted in sandboxed iframe
    }

    try {
      const v2Token = localStorage.getItem('puter.auth.token.v2');
      if (v2Token && v2Token.trim().length > 0) {
        return v2Token.trim();
      }
      const legacyToken = localStorage.getItem('puter.auth.token');
      if (legacyToken && legacyToken.trim().length > 0) {
        return legacyToken.trim();
      }
    } catch {
      // Storage access fallback
    }

    if (typeof window !== 'undefined' && window.puter) {
      const puterToken = window.puter.authToken || window.puter.auth?.authToken;
      if (puterToken && typeof puterToken === 'string' && puterToken.trim().length > 0) {
        return puterToken.trim();
      }
    }

    return null;
  },

  setToken(token: string | null): void {
    try {
      if (token && token.trim().length > 0) {
        sessionStorage.setItem(PUTER_SESSION_TOKEN_KEY, token.trim());
      } else {
        sessionStorage.removeItem(PUTER_SESSION_TOKEN_KEY);
      }
    } catch {
      // Restrictive storage fallback
    }
  },

  /**
   * Checks whether an active Puter context is established.
   */
  isSignedIn(): boolean {
    const token = this.getToken();
    if (token) return true;
    if (typeof window !== 'undefined' && window.puter?.auth?.isSignedIn) {
      try {
        return Boolean(window.puter.auth.isSignedIn());
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Retrieves high-level state without exposing token values.
   */
  async getUserState(): Promise<PuterUserState> {
    const hasToken = Boolean(this.getToken());
    if (typeof window !== 'undefined' && window.puter?.auth) {
      try {
        const signedIn = Boolean(window.puter.auth.isSignedIn?.() || hasToken);
        let username: string | undefined = undefined;
        if (signedIn && typeof window.puter.auth.getUser === 'function') {
          try {
            const user = await window.puter.auth.getUser();
            username = user?.username || user?.email || 'Connected Puter User';
          } catch {
            username = 'Connected Puter User';
          }
        }
        return {
          isSignedIn: signedIn,
          username,
          hasToken,
        };
      } catch {
        return { isSignedIn: hasToken, hasToken };
      }
    }
    return { isSignedIn: hasToken, hasToken };
  },

  /**
   * Interactive onboarding triggered by user gesture (button click).
   * Opens Puter auth popup requesting temporary or existing user session.
   */
  async connectInteractive(): Promise<string> {
    if (typeof window === 'undefined') {
      throw new PuterAuthError('Browser environment required.', 'NO_WINDOW');
    }

    // Ensure Puter script is available
    if (!window.puter) {
      // Dynamically load if script tag was not yet ready
      await new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector('script[src*="js.puter.com"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Puter SDK')));
          setTimeout(() => resolve(), 1500);
        } else {
          const script = document.createElement('script');
          script.src = 'https://js.puter.com/v2/';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Puter SDK script.'));
          document.head.appendChild(script);
        }
      });
    }

    if (!window.puter || !window.puter.auth) {
      throw new PuterAuthError('Puter SDK is not available. Please check internet connection.', 'SDK_UNAVAILABLE');
    }

    try {
      // Attempt temporary user onboarding or sign-in popup
      await window.puter.auth.signIn({ attempt_temp_user_creation: true });
    } catch (err: any) {
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('popup') || msg.includes('blocked') || msg.includes('window')) {
        throw new PuterAuthError(
          'Puter authentication popup was blocked by your browser. Please allow popups for this site or open in a direct tab.',
          'POPUP_BLOCKED'
        );
      }
      if (msg.includes('cancel') || msg.includes('closed') || msg.includes('dismissed')) {
        throw new PuterAuthError('Puter authentication was cancelled.', 'AUTH_CANCELED');
      }
      throw new PuterAuthError(
        'Unable to complete Puter authentication. Please ensure popups are allowed.',
        'AUTH_FAILED'
      );
    }

    const token = this.getToken();
    if (!token) {
      throw new PuterAuthError(
        'Puter authorization did not return an access token. Please retry.',
        'TOKEN_MISSING'
      );
    }

    this.setToken(token);
    return token;
  },

  /**
   * Disconnects Puter session context.
   */
  async disconnect(): Promise<void> {
    this.setToken(null);
    try {
      if (typeof window !== 'undefined' && window.puter?.auth?.signOut) {
        await window.puter.auth.signOut();
      }
    } catch {
      // Ignore disconnect cleanup errors
    }
  },
};
