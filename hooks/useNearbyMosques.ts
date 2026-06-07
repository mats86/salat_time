'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Mosque } from '@/types';

export function useNearbyMosques(lat?: number, lng?: number, radiusKm = 50) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (lat == null || lng == null) {
      setMosques([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radiusKm),
      });
      const res = await fetch(`/api/mosques?${params}`);
      if (!res.ok) throw new Error('Failed to load mosques');
      const json = await res.json();
      setMosques(json.data ?? []);
      setError(null);
    } catch {
      setError('Failed to load mosques');
      setMosques([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  return { mosques, loading, error, reload: load };
}
