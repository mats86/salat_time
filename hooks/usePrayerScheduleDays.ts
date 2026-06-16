'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  buildDaySchedule,
  fetchPrayerCalendar,
  getDateRangeKeys,
  getNextPrayer,
} from '@/lib/aladhan';
import { getCalcSettings } from '@/lib/calc-settings';
import { useCalcSettings } from '@/hooks/useCalcSettings';
import {
  cachePrayerCalendar,
  getCachedPrayerCalendar,
  todayDateKey,
} from '@/lib/offline-cache';
import type { DayPrayerSchedule } from '@/types';
import { useMounted } from '@/hooks/useMounted';

export function usePrayerScheduleDays(
  lat?: number,
  lng?: number,
  daysBefore = 7,
  daysAfter = 7
) {
  const pathname = usePathname();
  const { settings } = useCalcSettings();
  const mounted = useMounted();
  const [days, setDays] = useState<DayPrayerSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const todayIndex = daysBefore;
  const nextPrayerRef = useRef<ReturnType<typeof getNextPrayer> | null>(null);

  const load = useCallback(async () => {
    if (lat == null || lng == null) return;

    const { method, school, latitudeAdjust } = getCalcSettings();
    const today = todayDateKey();
    const { dates, months } = getDateRangeKeys(new Date(), daysBefore, daysAfter);

    setLoading(true);

    const dayMap = new Map<
      string,
      { timings: DayPrayerSchedule['timings']; hijri: DayPrayerSchedule['hijri'] }
    >();

    try {
      for (const { year, month } of months) {
        const cached = getCachedPrayerCalendar(
          lat,
          lng,
          year,
          month,
          method,
          school,
          latitudeAdjust
        );
        if (cached) {
          for (const day of cached.days) {
            dayMap.set(day.date, { timings: day.timings, hijri: day.hijri });
          }
        }
      }

      const missingMonths = months.filter(({ year, month }) => {
        const cached = getCachedPrayerCalendar(
          lat,
          lng,
          year,
          month,
          method,
          school,
          latitudeAdjust
        );
        return !cached;
      });

      if (missingMonths.length > 0) {
        await Promise.all(
          missingMonths.map(async ({ year, month }) => {
            const calendarDays = await fetchPrayerCalendar(
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
            for (const day of calendarDays) {
              dayMap.set(day.date, { timings: day.timings, hijri: day.hijri });
            }
          })
        );
      }

      const todayData = dayMap.get(today);
      if (todayData) {
        nextPrayerRef.current = getNextPrayer(todayData.timings);
      }

      const result: DayPrayerSchedule[] = dates
        .map((date) => {
          const data = dayMap.get(date);
          if (!data) return null;
          const isToday = date === today;
          return {
            date,
            timings: data.timings,
            hijri: data.hijri,
            isToday,
            schedule: buildDaySchedule(data.timings, {
              isToday,
              nextPrayer: isToday ? nextPrayerRef.current : null,
              mounted,
            }),
          };
        })
        .filter((d): d is DayPrayerSchedule => d != null);

      setDays(result);
      setError(result.length === 0 ? 'failed_prayer_times' : null);
    } catch {
      const todayData = dayMap.get(today);
      if (todayData) {
        nextPrayerRef.current = getNextPrayer(todayData.timings);
      }

      const fallback: DayPrayerSchedule[] = dates
        .map((date) => {
          const data = dayMap.get(date);
          if (!data) return null;
          const isToday = date === today;
          return {
            date,
            timings: data.timings,
            hijri: data.hijri,
            isToday,
            schedule: buildDaySchedule(data.timings, {
              isToday,
              nextPrayer: isToday ? nextPrayerRef.current : null,
              mounted,
            }),
          };
        })
        .filter((d): d is DayPrayerSchedule => d != null);

      if (fallback.length > 0) {
        setDays(fallback);
        setError(null);
      } else {
        setError('failed_prayer_times');
      }
    } finally {
      setLoading(false);
    }
  }, [
    lat,
    lng,
    daysBefore,
    daysAfter,
    mounted,
    settings.method,
    settings.school,
    settings.latitudeAdjust,
  ]);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const onCalcSettingsChanged = () => load();
    window.addEventListener('calc-settings-changed', onCalcSettingsChanged);
    return () => window.removeEventListener('calc-settings-changed', onCalcSettingsChanged);
  }, [load]);

  useEffect(() => {
    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  return { days, loading, error, todayIndex, reload: load };
}
