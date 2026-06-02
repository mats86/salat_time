'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  fetchPrayerTimes,
  getNextPrayer,
  getCountdownSeconds,
  formatCountdown,
  PRAYER_ORDER,
} from '@/lib/aladhan';
import type { HijriDate, PrayerTimings, PrayerName, MergedPrayerTime } from '@/types';

export function usePrayerTimes(lat?: number, lng?: number) {
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [countdown, setCountdown] = useState('');
  const [nextPrayer, setNextPrayer] = useState<{ name: PrayerName; time: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (lat == null || lng == null) return;
    setLoading(true);
    try {
      const data = await fetchPrayerTimes(lat, lng);
      setTimings(data.timings);
      setHijri(data.hijri);
      const next = getNextPrayer(data.timings);
      setNextPrayer(next);
      setError(null);
    } catch {
      setError('Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!nextPrayer) return;
    const tick = () => {
      const secs = getCountdownSeconds(nextPrayer.time);
      setCountdown(formatCountdown(secs));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextPrayer]);

  const schedule: MergedPrayerTime[] = timings
    ? PRAYER_ORDER.map((name) => {
        const now = new Date();
        const [h, m] = timings[name].split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(h, m, 0, 0);
        const isCurrent = nextPrayer?.name === name;
        return {
          name,
          time: timings[name],
          isCustom: false,
          isCurrent,
          isPast: prayerTime < now && !isCurrent,
        };
      })
    : [];

  return { timings, hijri, countdown, nextPrayer, schedule, loading, error, reload: load };
}
