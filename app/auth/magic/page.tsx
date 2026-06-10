'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens, getPostLoginPath, clearSessionAuth } from '@/lib/auth';
import { syncBiometricRefreshToken } from '@/lib/biometric';
import directus from '@/lib/directus';
import { useLang } from '@/components/providers/LangProvider';
import { Spinner } from '@/components/ui/Spinner';

type VerifyResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false };

const verifyInflight = new Map<string, Promise<VerifyResult>>();
const appliedTokens = new Set<string>();

async function verifyMagicToken(token: string): Promise<VerifyResult> {
  const existing = verifyInflight.get(token);
  if (existing) return existing;

  const promise = (async (): Promise<VerifyResult> => {
    const res = await fetch('/api/auth/magic-link/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return { ok: false };

    const json = await res.json().catch(() => null);
    const access = json?.access_token as string | undefined;
    const refresh = json?.refresh_token as string | undefined;
    if (!access || !refresh) return { ok: false };

    return { ok: true, access_token: access, refresh_token: refresh };
  })();

  verifyInflight.set(token, promise);
  try {
    return await promise;
  } finally {
    verifyInflight.delete(token);
  }
}

export default function MagicLinkPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { tr } = useLang();
  const handled = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = params.get('token');
    if (!token) {
      setError(tr.magicLinkInvalid);
      return;
    }

    (async () => {
      const result = await verifyMagicToken(token);

      if (!result.ok) {
        setError(tr.magicLinkExpired);
        return;
      }

      if (!appliedTokens.has(token)) {
        appliedTokens.add(token);
        clearSessionAuth();
        setTokens(result.access_token, result.refresh_token);
        syncBiometricRefreshToken(result.refresh_token);
        directus.setToken(result.access_token);
      }

      const redirectTo = params.get('redirect');
      const path = await getPostLoginPath(result.access_token, redirectTo);
      router.replace(path);
    })();
  }, [params, router, tr.magicLinkExpired, tr.magicLinkInvalid]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <p className="text-error text-center max-w-sm">{error}</p>
        <button
          type="button"
          onClick={() => router.replace('/auth/login')}
          className="text-secondary hover:underline text-sm"
        >
          {tr.login}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
