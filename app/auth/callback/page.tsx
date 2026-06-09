'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokensFromCallback, getRefreshToken } from '@/lib/auth';
import { syncBiometricRefreshToken } from '@/lib/biometric';
import { Spinner } from '@/components/ui/Spinner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const ok = setTokensFromCallback(params);
    if (ok) {
      const refresh = getRefreshToken();
      if (refresh) syncBiometricRefreshToken(refresh);
    }
    router.replace(ok ? '/staff' : '/auth/login?error=oauth');
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
