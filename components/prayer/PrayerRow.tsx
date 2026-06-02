'use client';

import { formatTime12 } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { MergedPrayerTime } from '@/types';

const PRAYER_ICONS: Record<string, string> = {
  Fajr: 'wb_twilight',
  Sunrise: 'wb_sunny',
  Dhuhr: 'light_mode',
  Asr: 'flare',
  Maghrib: 'nights_stay',
  Isha: 'bedtime',
};

export function PrayerRow({ prayer }: { prayer: MergedPrayerTime }) {
  if (prayer.isCurrent) {
    return (
      <div className="flex justify-between items-center px-4 py-4 bg-primary-container/30 rounded-xl border border-secondary/50 relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <span className="material-symbols-outlined text-secondary material-symbols-filled">
            {PRAYER_ICONS[prayer.name]}
          </span>
          <span className="font-title-md text-title-md text-secondary">{prayer.name}</span>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <span className="font-label-caps text-label-caps text-secondary-fixed bg-secondary-container/20 px-2 py-0.5 rounded">
            CURRENT
          </span>
          <span className="font-title-md text-title-md text-secondary">
            {formatTime12(prayer.time)}
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent" />
      </div>
    );
  }

  const dimmed = prayer.isPast;

  return (
    <div
      className={cn(
        'flex justify-between items-center px-4 py-4 glass-card rounded-xl border transition active:scale-[0.98]',
        dimmed
          ? 'border-outline-variant/10 opacity-60'
          : 'border-outline-variant/20'
      )}
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-on-surface-variant">
          {PRAYER_ICONS[prayer.name]}
        </span>
        <span className="font-title-md text-title-md text-on-surface">{prayer.name}</span>
      </div>
      <span className="font-title-md text-title-md text-on-surface">
        {formatTime12(prayer.time)}
      </span>
    </div>
  );
}
