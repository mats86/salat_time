'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPrayerAlertSettings, PRAYER_ALERT_NAMES, type PrayerAlertName, type PrayerAlertSettings } from '@/lib/prayer-alerts';

const DEFAULT_SETTINGS: PrayerAlertSettings = {
  masterEnabled: false,
  prayers: Object.fromEntries(PRAYER_ALERT_NAMES.map((p) => [p, false])) as Record<
    PrayerAlertName,
    boolean
  >,
};

export function usePrayerAlertSettings() {
  const [settings, setSettings] = useState<PrayerAlertSettings>(DEFAULT_SETTINGS);

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
