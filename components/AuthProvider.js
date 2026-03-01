'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { clearStoredUser, getStoredUser, setStoredUser } from '@/lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => getStoredUser());
  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    const handleAuthChange = (event) => {
      setUserState(event.detail || null);
    };

    window.addEventListener('auth:user-changed', handleAuthChange);
    return () => window.removeEventListener('auth:user-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedUser = getStoredUser();

      if (!storedUser?.token) {
        setAuthResolved(true);
        return;
      }

      setUserState(storedUser);

      try {
        const res = await api.get('/users/me');
        const mergedUser = { ...storedUser, ...(res.data.user || {}) };
        setStoredUser(mergedUser);
      } catch {
        clearStoredUser();
      } finally {
        setAuthResolved(true);
      }
    };

    bootstrapAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.token),
      authResolved,
      setUser: (nextUser) => setStoredUser(nextUser),
      clearUser: () => clearStoredUser(),
    }),
    [authResolved, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
