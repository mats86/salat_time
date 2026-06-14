'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchPrayerTimes,
  getNextPrayer,
  getCountdownSeconds,
  formatCountdown,
  PRAYER_ORDER,
} from '@/lib/aladhan';
import {
  cachePrayerTimes,
  getCachedPrayerTimes,
  isSameDayCache,
  todayDateKey,
} from '@/lib/offline-cache';
import type { HijriDate, PrayerTimings, PrayerName, MergedPrayerTime } from '@/types';
import { useMounted } from '@/hooks/useMounted';

function applyPrayerData(
  data: { timings: PrayerTimings; hijri: HijriDate },
  setTimings: (t: PrayerTimings) => void,
  setHijri: (h: HijriDate) => void,
  setNextPrayer: (n: { name: PrayerName; time: string }) => void
) {
  setTimings(data.timings);
  setHijri(data.hijri);
  setNextPrayer(getNextPrayer(data.timings));
}

export function usePrayerTimes(lat?: number, lng?: number) {
  const mounted = useMounted();
  const [timings, setTimings] = useState<PrayerTimings | null>(null);
  const [hijri, setHijri] = useState<HijriDate | null>(null);
  const [countdown, setCountdown] = useState('');
  const [nextPrayer, setNextPrayer] = useState<{ name: PrayerName; time: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const dateRef = useRef(todayDateKey());

  const load = useCallback(async () => {
    if (lat == null || lng == null) return;

    const cached = getCachedPrayerTimes(lat, lng);
    if (cached) {
      applyPrayerData(cached, setTimings, setHijri, setNextPrayer);
      setIsStale(!isSameDayCache(cached.date));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const data = await fetchPrayerTimes(lat, lng);
      cachePrayerTimes(lat, lng, data);
      applyPrayerData(data, setTimings, setHijri, setNextPrayer);
      setError(null);
      setIsOffline(false);
      setIsStale(false);
      dateRef.current = todayDateKey();
    } catch {
      if (cached) {
        setError(null);
        setIsOffline(true);
      } else {
        setError('failed_prayer_times');
        setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  useEffect(() => {
    const checkDate = () => {
      const today = todayDateKey();
      if (today !== dateRef.current) {
        dateRef.current = today;
        load();
      }
    };
    checkDate();
    const id = setInterval(checkDate, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkDate();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
        const isCurrent = nextPrayer?.name === name;
        let isPast = false;
        if (mounted) {
          const now = new Date();
          const [h, m] = timings[name].split(':').map(Number);
          const prayerTime = new Date();
          prayerTime.setHours(h, m, 0, 0);
          isPast = prayerTime < now && !isCurrent;
        }
        return {
          name,
          time: timings[name],
          isCustom: false,
          isCurrent,
          isPast,
        };
      })
    : [];

  return {
    timings,
    hijri,
    countdown,
    nextPrayer,
    schedule,
    loading,
    error,
    isOffline,
    isStale,
    reload: load,
  };
}
