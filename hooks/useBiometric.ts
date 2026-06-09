'use client';

import { useState, useEffect, useCallback } from 'react';
import directus from '@/lib/directus';
import { getRefreshToken, fetchCurrentUser } from '@/lib/auth';
import {
  isBiometricSupported,
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,
} from '@/lib/biometric';
import type { DirectusUser } from '@/types';

export function useBiometric(user?: DirectusUser | null) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupported(isBiometricSupported());
    setEnabled(isBiometricEnabled());
  }, []);

  const enable = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    setError(null);
    try {
      const refresh = getRefreshToken();
      if (!refresh) throw new Error('no_refresh_token');
      await enableBiometric(user, refresh);
      setEnabled(true);
      return true;
    } catch (err) {
      if (err instanceof Error && err.message === 'no_refresh_token') {
        setError('no_refresh_token');
      } else {
        setError('registration_failed');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const disable = useCallback(() => {
    disableBiometric();
    setEnabled(false);
    setError(null);
  }, []);

  const loginWithBiometric = useCallback(async (): Promise<{
    user: DirectusUser | null;
    error?: string;
  }> => {
    setLoading(true);
    setError(null);
    try {
      const access = await authenticateWithBiometric();
      if (!access) {
        setError('expired');
        return { user: null, error: 'expired' };
      }
      directus.setToken(access);
      const u = await fetchCurrentUser(access);
      return { user: u };
    } catch {
      setError('failed');
      return { user: null, error: 'failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, enabled, loading, error, enable, disable, loginWithBiometric };
}
