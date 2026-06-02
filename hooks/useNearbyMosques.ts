'use client';

import { useState, useEffect, useCallback } from 'react';
import directus, { readItems } from '@/lib/directus';
import { haversineKm } from '@/lib/aladhan';
import type { Mosque } from '@/types';

export function useNearbyMosques(lat?: number, lng?: number, radiusKm = 50) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (lat == null || lng == null) return;
    setLoading(true);
    try {
      const items = await directus.request(
        readItems('mosques', {
          filter: { status: { _eq: 'published' } },
          fields: ['*'],
          limit: 100,
        })
      );
      const withDistance = items
        .filter((m) => m.latitude != null && m.longitude != null)
        .map((m) => ({
          ...m,
          distance_km: haversineKm(lat, lng, m.latitude!, m.longitude!),
        }))
        .filter((m) => m.distance_km <= radiusKm)
        .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
      setMosques(withDistance);
      setError(null);
    } catch {
      setError('Failed to load mosques');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusKm]);

  useEffect(() => {
    load();
  }, [load]);

  return { mosques, loading, error, reload: load };
}
