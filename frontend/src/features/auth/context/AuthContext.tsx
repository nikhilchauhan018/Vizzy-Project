import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AuthUser, getAuthToken, setAuthToken } from '../../../services/authApi';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (data: {
    email: string;
    full_name: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
          setUser(null);
        }
        return;
      }

      try {
        const currentUser = await authApi.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setTokenState(storedToken);
        }
      } catch (err: any) {
        console.warn('Session expired or invalid, logging out:', err.message);
        if (isMounted) {
          setAuthToken(null);
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(credentials);
      setTokenState(res.token);
      setUser(res.user);
    } catch (err: any) {
      let msg = err?.message || 'Invalid email or password.';
      if (err instanceof TypeError || err?.name === 'TypeError' || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
        msg = 'Unable to connect to Vizzy. Please try again.';
      } else if (msg.includes('<') || msg.includes('doctype') || msg.includes('JSON') || msg.includes('SyntaxError')) {
        msg = 'Unable to complete sign in right now. Please try again.';
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (data: {
      email: string;
      full_name: string;
      password: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authApi.signup(data);
        setTokenState(res.token);
        setUser(res.user);
      } catch (err: any) {
        let msg = err?.message || 'Signup failed. Please check your information.';
        if (err instanceof TypeError || err?.name === 'TypeError' || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
          msg = 'Unable to connect to Vizzy. Please try again.';
        } else if (msg.includes('<') || msg.includes('doctype') || msg.includes('JSON') || msg.includes('SyntaxError')) {
          msg = 'Unable to complete sign in right now. Please try again.';
        }
        setError(msg);
        throw new Error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.logout();
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
