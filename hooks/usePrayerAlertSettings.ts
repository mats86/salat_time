'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPrayerAlertSettings, type PrayerAlertSettings } from '@/lib/prayer-alerts';

export function usePrayerAlertSettings() {
  const [settings, setSettings] = useState<PrayerAlertSettings>(() => getPrayerAlertSettings());

  const refresh = useCallback(() => {
    setSettings(getPrayerAlertSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('prayer-alerts-changed', handler);
    return () => window.removeEventListener('prayer-alerts-changed', handler);
  }, [refresh]);

  return { settings, refresh };
}
