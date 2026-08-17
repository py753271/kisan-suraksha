'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAccessToken } from '../utils/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkSession = async () => {
    try {
      // Fetch session token refresh first
      const refreshResponse = await api.post('/auth/refresh');
      const token = refreshResponse.data.data.accessToken;
      setAccessToken(token);

      // Fetch user profile info
      const profileResponse = await api.get('/auth/profile');
      setUser(profileResponse.data.data);
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      router.push('/auth');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth_logout', handleLogoutEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth_logout', handleLogoutEvent);
      }
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken: token, user: userData } = response.data.data;
      setAccessToken(token);
      setUser(userData);
      router.push('/dashboard');
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/auth/register', data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore failure logout
    } finally {
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      router.push('/auth');
    }
  };

  const hasRole = (role: string) => {
    return user?.role === role;
  };

  const hasPermission = (permission: string) => {
    return user?.permissions.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        checkSession,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
