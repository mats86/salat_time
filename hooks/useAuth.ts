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

let loadUserInflight: Promise<DirectusUser | null> | null = null;

export function useAuth() {
  const [user, setUser] = useState<DirectusUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (loadUserInflight) {
      const resolved = await loadUserInflight;
      setUser(resolved);
      setLoading(false);
      return;
    }

    loadUserInflight = (async (): Promise<DirectusUser | null> => {
    let token = getAccessToken();
    const storedRefresh = getRefreshToken();

    if (!token && storedRefresh) {
      token = await refreshAccessToken();
    }

    if (!token) {
      const sessionUser = await fetchCurrentUserWithSession();
      if (sessionUser) {
        setSessionAuth(true);
        return sessionUser;
      }
      if (usesSessionAuth()) {
        clearSessionAuth();
      }
      return null;
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
        return sessionUser;
      }
      clearTokens();
      clearSessionAuth();
      return null;
    }

    clearSessionAuth();
    directus.setToken(token);
    const refresh = getRefreshToken();
    if (refresh) syncBiometricRefreshToken(refresh);
    return u;
    })();

    try {
      const resolved = await loadUserInflight;
      setUser(resolved);
    } finally {
      loadUserInflight = null;
      setLoading(false);
    }
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
