'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager' | 'operator' | 'viewer';
  org_id: string | null;
  org_name: string | null;
  status: string;
}

export interface AuthOrg {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan_name: string;
  subscription_status: string;
}

interface AuthContextType {
  user: AuthUser | null;
  org: AuthOrg | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  orgName: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  industry?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [org, setOrg] = useState<AuthOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
      setOrg(data.data.org || null);
    } catch {
      setUser(null);
      setOrg(null);
    }
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: u, org: o } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    setOrg(o || null);
    if (u.role === 'superadmin') {
      router.push('/superadmin');
    } else {
      router.push('/dashboard');
    }
  };

  const register = async (formData: RegisterData) => {
    const { data } = await api.post('/auth/register', formData);
    const { accessToken, refreshToken, user: u, org: o } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(u);
    setOrg(o || null);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setOrg(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, org, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(allowedRoles?: string[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, loading, router, allowedRoles]);
  return { user, loading };
}
