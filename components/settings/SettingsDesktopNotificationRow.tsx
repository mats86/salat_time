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
import { cn } from '@/lib/utils';

interface SettingsDesktopNotificationRowProps {
  prayer: PrayerAlertName;
  icon: string;
  title: string;
  subtitle: string;
  dimmed?: boolean;
  soundLabel?: string;
  soundIcon?: string;
  soundMuted?: boolean;
}

export function SettingsDesktopNotificationRow({
  prayer,
  icon,
  title,
  subtitle,
  dimmed = false,
  soundLabel,
  soundIcon = 'volume_up',
  soundMuted = false,
}: SettingsDesktopNotificationRowProps) {
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
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 glass-card rounded-lg relative',
        dimmed && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            dimmed ? 'bg-primary-container/30 text-on-surface-variant' : 'bg-primary-container text-primary'
          )}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <h4 className="font-title-md">{title}</h4>
          <span className="text-body-sm text-on-surface-variant">{subtitle}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {soundLabel && (
          <div className="flex flex-col items-end">
            <span className="text-body-sm text-on-surface-variant mb-1">
              {soundMuted ? tr.alertOnly : tr.adhanSound}
            </span>
            <div
              className={cn(
                'flex items-center gap-2 cursor-pointer hover:opacity-80',
                soundMuted ? 'text-primary/60' : 'text-secondary'
              )}
            >
              <span className={cn('font-body-sm', !soundMuted && 'font-bold')}>{soundLabel}</span>
              <span className="material-symbols-outlined text-sm">{soundIcon}</span>
            </div>
          </div>
        )}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => void handleChange(e.target.checked)}
          />
          <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
        </label>
      </div>
      {hint && (
        <span className="absolute bottom-full right-4 mb-1 z-50 whitespace-nowrap rounded-lg bg-surface-container-high border border-outline-variant/20 px-2 py-1 font-body-sm text-body-sm text-on-surface shadow-lg">
          {hint}
        </span>
      )}
    </div>
  );
}
