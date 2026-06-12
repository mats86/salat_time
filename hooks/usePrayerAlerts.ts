'use client';

import { useEffect, useCallback } from 'react';
import {
  PRAYER_ALERT_NAMES,
  isPrayerAlertActive,
  isPrayerTimeNow,
  markPrayerFired,
  playAdhan,
  postScheduleToServiceWorker,
  wasPrayerFiredToday,
} from '@/lib/prayer-alerts';
import type { Lang } from '@/types';
import type { PrayerTimings } from '@/types';

export function usePrayerAlerts(timings: PrayerTimings | null, lang: Lang) {
  const syncSchedule = useCallback(async () => {
    if (!timings) return;
    await postScheduleToServiceWorker(timings, lang);
  }, [timings, lang]);

  useEffect(() => {
    syncSchedule();
  }, [syncSchedule]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        syncSchedule();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncSchedule]);

  useEffect(() => {
    const onSettingsChanged = () => {
      syncSchedule();
    };
    window.addEventListener('prayer-alerts-changed', onSettingsChanged);
    return () => window.removeEventListener('prayer-alerts-changed', onSettingsChanged);
  }, [syncSchedule]);

  useEffect(() => {
    if (!timings) return;

    const tick = () => {
      if (document.visibilityState !== 'visible') return;

      for (const prayer of PRAYER_ALERT_NAMES) {
        if (!isPrayerAlertActive(prayer)) continue;
        if (!isPrayerTimeNow(timings[prayer])) continue;
        if (wasPrayerFiredToday(prayer)) continue;

        markPrayerFired(prayer);
        void playAdhan();
      }
    };

    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timings]);
}
