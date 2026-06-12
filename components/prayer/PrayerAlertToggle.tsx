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

interface PrayerAlertToggleProps {
  prayer: PrayerAlertName;
  dimmed?: boolean;
  filled?: boolean;
  className?: string;
}

export function PrayerAlertToggle({
  prayer,
  dimmed = false,
  filled = false,
  className,
}: PrayerAlertToggleProps) {
  const { tr } = useLang();
  const { settings } = usePrayerAlertSettings();
  const [hint, setHint] = useState<string | null>(null);
  const enabled = settings.masterEnabled && settings.prayers[prayer];

  const showHint = (message: string) => {
    setHint(message);
    window.setTimeout(() => setHint(null), 3000);
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!canUsePrayerAlerts()) {
      showHint(tr.alertPwaRequired);
      return;
    }

    const permission = await requestNotificationPermission();
    if (permission === 'denied') {
      showHint(tr.alertPermissionDenied);
      return;
    }

    const next = !enabled;
    if (next) {
      await unlockAdhanAudio();
    }

    setPrayerAlertEnabled(prayer, next);
  };

  const icon = dimmed
    ? 'notifications_off'
    : enabled
      ? 'notifications_active'
      : 'notifications';

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={dimmed}
        aria-label={enabled ? tr.alertOn : tr.alertOff}
        aria-pressed={enabled}
        className={cn(
          'material-symbols-outlined transition-colors',
          dimmed
            ? 'text-outline-variant cursor-default'
            : enabled
              ? 'text-secondary cursor-pointer'
              : 'text-on-surface-variant cursor-pointer hover:text-secondary',
          filled && enabled && 'material-symbols-filled',
          className
        )}
        style={filled && enabled ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </button>
      {hint && (
        <span className="absolute bottom-full right-0 mb-1 z-50 whitespace-nowrap rounded-lg bg-surface-container-high border border-outline-variant/20 px-2 py-1 font-body-sm text-body-sm text-on-surface shadow-lg">
          {hint}
        </span>
      )}
    </span>
  );
}
