'use client';

import { useState, useEffect, useCallback } from 'react';
import directus from '@/lib/directus';
import {
  getRefreshToken,
  fetchCurrentUser,
  exchangeSessionForTokens,
  usesSessionAuth,
} from '@/lib/auth';
import {
  isBiometricEnabled,
  enableBiometric,
  disableBiometric,
  authenticateWithBiometric,
  checkBiometricSupport,
  type BiometricSupportReason,
} from '@/lib/biometric';
import type { DirectusUser } from '@/types';

export function useBiometric(user?: DirectusUser | null) {
  const [supported, setSupported] = useState(false);
  const [supportReason, setSupportReason] = useState<BiometricSupportReason>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await checkBiometricSupport();
      if (cancelled) return;
      setSupported(result.supported);
      setSupportReason(result.reason);
      setEnabled(isBiometricEnabled());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!user) return false;
    setLoading(true);
    setError(null);
    try {
      let refresh = getRefreshToken();
      if (!refresh && usesSessionAuth()) {
        const tokens = await exchangeSessionForTokens();
        refresh = tokens?.refresh_token ?? null;
      }
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
      const result = await authenticateWithBiometric();
      if (!result.ok) {
        const err =
          result.error === 'token_expired' || result.error === 'no_bio_refresh'
            ? 'expired'
            : 'failed';
        setError(err);
        return { user: null, error: err };
      }
      directus.setToken(result.access);
      const u = await fetchCurrentUser(result.access);
      return { user: u };
    } catch {
      setError('failed');
      return { user: null, error: 'failed' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, supportReason, enabled, loading, error, enable, disable, loginWithBiometric };
}
