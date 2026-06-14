'use client';

import { useEffect } from 'react';

async function ensureServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration('/')) ??
      (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));

    await registration.update().catch(() => {});
    await navigator.serviceWorker.ready;
  } catch {
    /* best-effort fallback registration */
  }
}

export function ServiceWorkerBootstrap() {
  useEffect(() => {
    ensureServiceWorker();

    const onOnline = () => {
      ensureServiceWorker();
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') ensureServiceWorker();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
