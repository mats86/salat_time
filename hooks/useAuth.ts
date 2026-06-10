'use client';

import { useState, useEffect, useCallback } from 'react';
import directus from '@/lib/directus';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  fetchCurrentUser,
  fetchCurrentUserWithSession,
  refreshAccessToken,
  isStaff,
  isAdmin,
  loginWithEmailPassword,
  logoutSession,
  setSessionAuth,
  clearSessionAuth,
  usesSessionAuth,
} from '@/lib/auth';
import { syncBiometricRefreshToken } from '@/lib/biometric';
import type { DirectusUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<DirectusUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    let token = getAccessToken();
    const storedRefresh = getRefreshToken();

    if (!token && storedRefresh) {
      token = await refreshAccessToken();
    }

    if (!token) {
      const sessionUser = await fetchCurrentUserWithSession();
      if (sessionUser) {
        setSessionAuth(true);
        setUser(sessionUser);
      } else if (usesSessionAuth()) {
        clearSessionAuth();
        setUser(null);
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    let u = await fetchCurrentUser(token);
    if (!u && (storedRefresh || getRefreshToken())) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        token = refreshed;
        u = await fetchCurrentUser(token);
      }
    }

    if (!u) {
      const sessionUser = await fetchCurrentUserWithSession();
      if (sessionUser) {
        setSessionAuth(true);
        setUser(sessionUser);
        setLoading(false);
        return;
      }
      clearTokens();
      clearSessionAuth();
      setUser(null);
      setLoading(false);
      return;
    }

    clearSessionAuth();
    directus.setToken(token);
    const refresh = getRefreshToken();
    if (refresh) syncBiometricRefreshToken(refresh);
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadUser();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const result = await loginWithEmailPassword(email, password);
    clearSessionAuth();
    setTokens(result.access_token, result.refresh_token);
    if (result.refresh_token) syncBiometricRefreshToken(result.refresh_token);
    directus.setToken(result.access_token);
    await loadUser();
  };

  const logout = async () => {
    if (usesSessionAuth() || !getAccessToken()) {
      await logoutSession();
    } else {
      try {
        await directus.logout();
      } catch {
        /* ignore */
      }
    }
    clearTokens();
    clearSessionAuth();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    reload: loadUser,
    isStaff: isStaff(user),
    isAdmin: isAdmin(user),
  };
}
