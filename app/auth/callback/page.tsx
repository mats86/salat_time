'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { completeOAuthCallback, getAccessToken, getPostLoginPath, getRefreshToken } from '@/lib/auth';
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
      const ok = await completeOAuthCallback(params);
      if (cancelled) return;

      if (!ok) {
        router.replace('/auth/login?error=oauth');
        return;
      }

      const refresh = getRefreshToken();
      if (refresh) syncBiometricRefreshToken(refresh);

      const token = getAccessToken();
      if (!token) {
        router.replace('/auth/login?error=oauth');
        return;
      }

      const redirectTo = new URLSearchParams(window.location.search).get('redirect');
      const path = await getPostLoginPath(token, redirectTo);
      if (!cancelled) router.replace(path);
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
