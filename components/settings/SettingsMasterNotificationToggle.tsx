'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { usePrayerAlertSettings } from '@/hooks/usePrayerAlertSettings';
import { Toggle } from '@/components/ui/Toggle';
import {
  canUsePrayerAlerts,
  requestPrayerAlertPermission,
  setMasterEnabled,
  syncPrayerAlertScheduling,
} from '@/lib/prayer-alerts';

export function SettingsMasterNotificationToggle() {
  const { tr } = useLang();
  const { settings } = usePrayerAlertSettings();
  const [hint, setHint] = useState<string | null>(null);

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(null), 3000);
  };

  const handleChange = async (checked: boolean) => {
    if (!canUsePrayerAlerts()) {
      showHint(tr.alertPwaRequired);
      return;
    }

    if (checked) {
      const granted = await requestPrayerAlertPermission();
      if (!granted) {
        showHint(tr.alertPermissionDenied);
        return;
      }
    }

    setMasterEnabled(checked);
    await syncPrayerAlertScheduling();

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="p-4 flex items-center justify-between gap-4 relative">
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary text-xl">
            notifications_active
          </span>
        </div>
        <div className="min-w-0">
          <span className="font-title-md text-on-surface block">{tr.prayerNotificationsMaster}</span>
          <span className="text-xs text-on-surface-variant block">{tr.prayerNotificationsMasterDesc}</span>
        </div>
      </div>
      <Toggle
        checked={settings.masterEnabled}
        onChange={(checked) => void handleChange(checked)}
        aria-label={tr.prayerNotificationsMaster}
      />
      {hint && (
        <span className="absolute bottom-full right-4 mb-1 z-50 whitespace-nowrap rounded-lg bg-surface-container-high border border-outline-variant/20 px-2 py-1 font-body-sm text-body-sm text-on-surface shadow-lg">
          {hint}
        </span>
      )}
    </div>
  );
}
