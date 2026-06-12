'use client';

import { useLang } from '@/components/providers/LangProvider';
import { usePrayerAlertSettings } from '@/hooks/usePrayerAlertSettings';
import { getPrayerLabel } from '@/lib/i18n';
import { formatTime12, formatCountdownShort } from '@/lib/utils';
import type { PrayerName } from '@/types';

interface PrayerTimeHeroProps {
  prayerName: PrayerName;
  prayerTime: string;
  countdown: string;
}

export function PrayerTimeHero({ prayerName, prayerTime, countdown }: PrayerTimeHeroProps) {
  const { lang, tr } = useLang();
  const { settings } = usePrayerAlertSettings();
  const parts = countdown.split(':').map(Number);
  let short = countdown;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    short = formatCountdownShort(h * 3600 + m * 60 + s);
  }

  const alertsActive = settings.masterEnabled;

  return (
    <section className="relative overflow-hidden rounded-xl bg-primary-container p-8 prayer-glow border border-primary/10">
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <p className="font-label-caps text-label-caps text-secondary tracking-[0.2em] uppercase">
          {tr.nextPrayer}
        </p>
        <h3 className="font-display-lg text-display-lg text-secondary-fixed flex items-baseline gap-2 flex-wrap justify-center">
          {getPrayerLabel(lang, prayerName)}{' '}
          <span className="animate-pulse">{tr.in}</span>{' '}
          {short}
        </h3>
        <div className="flex items-center gap-4 text-on-primary-container">
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span className="font-body-sm text-body-sm">{formatTime12(prayerTime)}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant" />
          <div className="flex items-center gap-1">
            <span
              className={`material-symbols-outlined text-sm ${alertsActive ? 'material-symbols-filled' : ''}`}
              style={alertsActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {alertsActive ? 'notifications_active' : 'notifications_off'}
            </span>
            <span className="font-body-sm text-body-sm">
              {alertsActive ? tr.alertOn : tr.alertOff}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-secondary/10 blur-[60px] rounded-full" />
    </section>
  );
}
