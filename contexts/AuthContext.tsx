import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrToken: string, password?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  redirectToSSO: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  // Skip checkAuth if we're on callback page (avoid race condition)
  useEffect(() => {
    // Check URL directly (router.pathname might not be ready yet)
    const isCallbackPage = typeof window !== 'undefined' && 
                          (window.location.pathname === '/auth/callback' ||
                           window.location.pathname.includes('/auth/callback'));
    
    if (isCallbackPage) {
      console.log('[AuthContext] Skipping checkAuth - on callback page');
      setLoading(false);
      return;
    }
    
    console.log('[AuthContext] Running checkAuth...');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrToken: string, password?: string) => {
    const isDev = process.env.NODE_ENV === 'development';
    
    try {
      // Mode 1: SSO Login - jika hanya ada 1 parameter (token)
      if (!password) {
        const token = emailOrToken;
        if (isDev) {
          console.log('[AuthContext] SSO Login mode detected');
          console.log('[AuthContext] Token preview:', token.substring(0, 30) + '...');
        }
        
        // Simpan token
        localStorage.setItem('token', token);
        if (isDev) console.log('[AuthContext] Token saved to localStorage');
        
        // Verify dan get user info dari token
        if (isDev) console.log('[AuthContext] Calling /api/auth/verify...');
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (isDev) {
          console.log('[AuthContext] Verify response status:', response.status);
          console.log('[AuthContext] Verify response ok:', response.ok);
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[AuthContext] Verification failed:', errorData);
          throw new Error(errorData.error || 'Token verification failed');
        }

        const data = await response.json();
        if (isDev) console.log('[AuthContext] User data received:', data.user);
        
        setUser(data.user);
        console.log('[AuthContext] SSO Login successful:', data.user.email);
        
        if (isDev) console.log('[AuthContext] Redirecting to /');
        router.push('/');
        return;
      }

      // Mode 2: Local Login (Legacy) - dengan email dan password
      const email = emailOrToken;
      console.log('[AuthContext] Local login with email/password');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      localStorage.setItem('token', data.token);
      setUser(data.user);
      router.push('/');
    } catch (error) {
      throw error;
    }
  };

  const redirectToSSO = () => {
    const ssoUrl = process.env.NEXT_PUBLIC_SSO_URL;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    if (!ssoUrl || !appUrl) {
      throw new Error('SSO URL and APP URL must be configured in environment variables');
    }
    const callbackUrl = `${appUrl}/auth/callback`;
    
    console.log('[AuthContext] Redirecting to SSO:', ssoUrl);
    console.log('[AuthContext] Callback URL:', callbackUrl);
    
    // Redirect ke SSO login dengan callback URL
    window.location.href = `${ssoUrl}/login?redirect_uri=${encodeURIComponent(callbackUrl)}&app_name=PFTU`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    redirectToSSO,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
