'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { fetchPrayerCalendar } from '@/lib/aladhan';
import { getCalcSettings } from '@/lib/calc-settings';
import { useCalcSettings } from '@/hooks/useCalcSettings';
import {
  cachePrayerCalendar,
  getCachedPrayerCalendar,
  todayDateKey,
} from '@/lib/offline-cache';
import type { CalendarDayEntry } from '@/lib/aladhan';

export function usePrayerCalendarMonth(lat?: number, lng?: number) {
  const pathname = usePathname();
  const { settings } = useCalcSettings();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [days, setDays] = useState<CalendarDayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (lat == null || lng == null) return;

    const { method, school, latitudeAdjust } = getCalcSettings();
    setLoading(true);

    try {
      let calendarDays = getCachedPrayerCalendar(
        lat,
        lng,
        year,
        month,
        method,
        school,
        latitudeAdjust
      )?.days;

      if (!calendarDays) {
        calendarDays = await fetchPrayerCalendar(
          year,
          month,
          lat,
          lng,
          method,
          school,
          latitudeAdjust
        );
        cachePrayerCalendar(
          lat,
          lng,
          year,
          month,
          calendarDays,
          method,
          school,
          latitudeAdjust
        );
      }

      setDays(calendarDays);
      setError(null);
    } catch {
      const cached = getCachedPrayerCalendar(
        lat,
        lng,
        year,
        month,
        getCalcSettings().method,
        getCalcSettings().school,
        getCalcSettings().latitudeAdjust
      );
      if (cached) {
        setDays(cached.days);
        setError(null);
      } else {
        setError('failed_prayer_times');
      }
    } finally {
      setLoading(false);
    }
  }, [lat, lng, year, month, settings.method, settings.school, settings.latitudeAdjust]);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const onCalcSettingsChanged = () => load();
    window.addEventListener('calc-settings-changed', onCalcSettingsChanged);
    return () => window.removeEventListener('calc-settings-changed', onCalcSettingsChanged);
  }, [load]);

  const goToPreviousMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const today = todayDateKey();

  return {
    days,
    loading,
    error,
    year,
    month,
    goToPreviousMonth,
    goToNextMonth,
    today,
  };
}
