'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  completeOAuthCallback,
  getAccessToken,
  getPostLoginPath,
  getRefreshToken,
} from '@/lib/auth';
import { syncBiometricRefreshToken } from '@/lib/biometric';
import { Spinner } from '@/components/ui/Spinner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    let cancelled = false;

    (async () => {
      const result = await completeOAuthCallback(params);
      if (cancelled) return;

      if (!result.ok) {
        router.replace('/auth/login?error=oauth');
        return;
      }

      const redirectTo = new URLSearchParams(window.location.search).get('redirect');
      const token = getAccessToken();

      if (token) {
        const refresh = getRefreshToken();
        if (refresh) syncBiometricRefreshToken(refresh);
        const path = await getPostLoginPath(token, redirectTo);
        if (!cancelled) router.replace(path);
        return;
      }

      if (result.user) {
        const path = await getPostLoginPath(result.user, redirectTo);
        if (!cancelled) router.replace(path);
        return;
      }

      router.replace('/auth/login?error=oauth');
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
