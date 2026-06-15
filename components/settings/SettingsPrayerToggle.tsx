'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { usePrayerAlertSettings } from '@/hooks/usePrayerAlertSettings';
import {
  canUsePrayerAlerts,
  requestNotificationPermission,
  setPrayerAlertEnabled,
  unlockAdhanAudio,
  type PrayerAlertName,
} from '@/lib/prayer-alerts';
interface SettingsPrayerToggleProps {
  prayer: PrayerAlertName;
  icon: string;
  label: string;
}

export function SettingsPrayerToggle({ prayer, icon, label }: SettingsPrayerToggleProps) {
  const { tr } = useLang();
  const { settings } = usePrayerAlertSettings();
  const [hint, setHint] = useState<string | null>(null);
  const enabled = settings.masterEnabled && settings.prayers[prayer];

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(null), 3000);
  };

  const handleChange = async (checked: boolean) => {
    if (!canUsePrayerAlerts()) {
      showHint(tr.alertPwaRequired);
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === 'denied') {
      showHint(tr.alertPermissionDenied);
      return;
    }

    if (checked) {
      await unlockAdhanAudio();
    }

    setPrayerAlertEnabled(prayer, checked);

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <div className="p-4 flex items-center justify-between relative">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
        </div>
        <span className="font-title-md text-on-surface">{label}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer w-11 h-6 shrink-0">
        <input
          type="checkbox"
          className="sr-only settings-toggle"
          checked={enabled}
          onChange={(e) => void handleChange(e.target.checked)}
        />
        <div className="settings-toggle-bg absolute inset-0 rounded-full bg-surface-variant transition-colors" />
        <div className="settings-toggle-dot absolute left-1 top-1 w-4 h-4 rounded-full bg-on-surface-variant transition-transform" />
      </label>
      {hint && (
        <span className="absolute bottom-full right-4 mb-1 z-50 whitespace-nowrap rounded-lg bg-surface-container-high border border-outline-variant/20 px-2 py-1 font-body-sm text-body-sm text-on-surface shadow-lg">
          {hint}
        </span>
      )}
    </div>
  );
}
