'use client';

import { useState, useEffect, useCallback } from 'react';
import { cacheMosques, getCachedMosques } from '@/lib/offline-cache';
import type { Mosque } from '@/types';

export function useNearbyMosques(lat?: number, lng?: number, radiusKm = 50) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const load = useCallback(async () => {
    if (lat == null || lng == null) {
      setMosques([]);
      setLoading(false);
      return;
    }

    const cached = getCachedMosques(lat, lng);
    if (cached) {
      setMosques(cached.mosques);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radiusKm),
      });
      const res = await fetch(`/api/mosques?${params}`);
      if (!res.ok) throw new Error('Failed to load mosques');
      const json = await res.json();
      const data = (json.data ?? []) as Mosque[];
      setMosques(data);
      cacheMosques(lat, lng, data);
      setError(null);
      setIsOffline(false);
    } catch {
      if (cached) {
        setError(null);
        setIsOffline(true);
      } else {
        setError('Failed to load mosques');
        setMosques([]);
        setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  return { mosques, loading, error, isOffline, reload: load };
}
