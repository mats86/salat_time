'use client';

import { useEffect } from 'react';
import { warmupNavigationCache } from '@/lib/cache-warmup';

export function CacheWarmup() {
  useEffect(() => {
    warmupNavigationCache();

    const onOnline = () => {
      warmupNavigationCache();
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return null;
}
