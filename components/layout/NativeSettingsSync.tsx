'use client';

import { useEffect } from 'react';
import {
  refreshNativeNotifications,
  syncNativeSettings,
} from '@/lib/native-bridge';

/** Keeps Capacitor native prefs in sync with web localStorage for the Android widget. */
export function NativeSettingsSync() {
  useEffect(() => {
    void syncNativeSettings();

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (
        event.key === 'lang' ||
        event.key === 'sz_calc_method' ||
        event.key === 'sz_calc_school' ||
        event.key === 'sz_calc_latitude_adjust' ||
        event.key === 'salat_location_v2' ||
        event.key === 'sz_prayer_alerts_master' ||
        event.key?.startsWith('sz_prayer_alerts_')
      ) {
        void syncNativeSettings();
      }
    };

    const onCalcChanged = () => {
      void syncNativeSettings();
    };

    const onPrayerAlertsChanged = () => {
      void syncNativeSettings().then(() => refreshNativeNotifications());
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('calc-settings-changed', onCalcChanged);
    window.addEventListener('prayer-alerts-changed', onPrayerAlertsChanged);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('calc-settings-changed', onCalcChanged);
      window.removeEventListener('prayer-alerts-changed', onPrayerAlertsChanged);
    };
  }, []);

  return null;
}
