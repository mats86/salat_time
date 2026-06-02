'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokensFromCallback } from '@/lib/auth';
import { Spinner } from '@/components/ui/Spinner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const ok = setTokensFromCallback(params);
    router.replace(ok ? '/staff' : '/auth/login?error=oauth');
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
