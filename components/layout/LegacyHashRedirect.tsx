'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redirect old `/#qibla` links to the dedicated Qibla page. */
export function LegacyHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.hash === '#qibla') {
      router.replace('/qibla');
    }
  }, [router]);

  return null;
}
