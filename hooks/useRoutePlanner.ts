'use client';

import { useCallback, useState } from 'react';
import type { OsrmProfile } from '@/lib/route';
import type { RoutePlan, RoutePoint, RoutePlannerStatus } from '@/types';

export function useRoutePlanner() {
  const [start, setStart] = useState<RoutePoint | null>(null);
  const [end, setEnd] = useState<RoutePoint | null>(null);
  const [profile, setProfile] = useState<OsrmProfile>('driving');
  const [bufferKm, setBufferKm] = useState(2);
  const [status, setStatus] = useState<RoutePlannerStatus>('idle');
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (overrides?: { start?: RoutePoint; end?: RoutePoint }) => {
    const resolvedStart = overrides?.start ?? start;
    const resolvedEnd = overrides?.end ?? end;
    if (!resolvedStart || !resolvedEnd) return;

    if (overrides?.start) setStart(overrides.start);
    if (overrides?.end) setEnd(overrides.end);

    setStatus('loading');
    setError(null);

    try {
      const params = new URLSearchParams({
        startLat: String(resolvedStart.lat),
        startLng: String(resolvedStart.lng),
        endLat: String(resolvedEnd.lat),
        endLng: String(resolvedEnd.lng),
        profile,
        bufferKm: String(bufferKm),
      });

      const res = await fetch(`/api/route/plan?${params}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.errors?.[0]?.message ?? 'Failed to plan route');
      }

      setPlan(json.data as RoutePlan);
      setStatus('done');
    } catch (err) {
      setPlan(null);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to plan route');
    }
  }, [start, end, profile, bufferKm]);

  const reset = useCallback(() => {
    setPlan(null);
    setStatus('idle');
    setError(null);
  }, []);

  return {
    start,
    setStart,
    end,
    setEnd,
    profile,
    setProfile,
    bufferKm,
    setBufferKm,
    status,
    plan,
    error,
    calculate,
    reset,
  };
}
