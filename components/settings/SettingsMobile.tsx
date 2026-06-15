'use client';

import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { getPrayerLabel } from '@/lib/i18n';
import { PRAYER_ALERT_NAMES } from '@/lib/prayer-alerts';
import { SettingsPrayerToggle } from '@/components/settings/SettingsPrayerToggle';
import { cn } from '@/lib/utils';

const APP_VERSION = '2.4.0-gold';

const LANG_OPTIONS: { code: Lang; labelKey: 'langEnglish' | 'langDeutsch' | 'langArabic' }[] = [
  { code: 'en', labelKey: 'langEnglish' },
  { code: 'de', labelKey: 'langDeutsch' },
  { code: 'ar', labelKey: 'langArabic' },
];

const PRAYER_ICONS: Record<string, string> = {
  Fajr: 'brightness_3',
  Dhuhr: 'wb_sunny',
  Asr: 'wb_twilight',
  Maghrib: 'sunny_snowing',
  Isha: 'dark_mode',
};

export function SettingsMobile() {
  const { lang, setLang, tr } = useLang();

  const calculationMethod = tr.calculationMethodMWL;

  return (
    <main className="pt-20 px-margin-mobile max-w-2xl mx-auto space-y-stack-lg pb-24">
      {/* Language Switcher */}
      <section className="space-y-stack-md">
        <h2 className="font-label-caps text-label-caps text-secondary opacity-80 uppercase tracking-widest px-1">
          {tr.settingsLanguage}
        </h2>
        <div className="settings-glass-card rounded-xl p-stack-sm flex gap-2">
          {LANG_OPTIONS.map(({ code, labelKey }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={cn(
                'flex-1 py-3 px-4 rounded-lg font-title-md text-sm transition-all',
                lang === code
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-on-surface-variant hover:bg-surface-variant/30'
              )}
            >
              {tr[labelKey]}
            </button>
          ))}
        </div>
      </section>

      {/* Calculation Method */}
      <section className="space-y-stack-md">
        <h2 className="font-label-caps text-label-caps text-secondary opacity-80 uppercase tracking-widest px-1">
          {tr.settingsPrayerCalculation}
        </h2>
        <div className="settings-glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between settings-gold-glow transition-all group">
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface">{tr.calculationMethod}</span>
              <span className="text-xs text-on-surface-variant">{calculationMethod}</span>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-60">expand_more</span>
          </div>
          <div className="p-4 flex items-center justify-between settings-gold-glow transition-all">
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface">{tr.asrJuristicMethod}</span>
              <span className="text-xs text-on-surface-variant">{tr.asrJuristicStandard}</span>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-60">chevron_right</span>
          </div>
        </div>
      </section>

      {/* Notification Management */}
      <section className="space-y-stack-md">
        <h2 className="font-label-caps text-label-caps text-secondary opacity-80 uppercase tracking-widest px-1">
          {tr.settingsNotifications}
        </h2>
        <div className="settings-glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          {PRAYER_ALERT_NAMES.map((prayer) => (
            <SettingsPrayerToggle
              key={prayer}
              prayer={prayer}
              icon={PRAYER_ICONS[prayer]}
              label={getPrayerLabel(lang, prayer)}
            />
          ))}
        </div>
      </section>

      {/* Support & About */}
      <section className="space-y-stack-md">
        <h2 className="font-label-caps text-label-caps text-secondary opacity-80 uppercase tracking-widest px-1">
          {tr.settingsSupportAbout}
        </h2>
        <div className="settings-glass-card rounded-xl overflow-hidden divide-y divide-white/5">
          <a
            href="#"
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <span className="font-title-md text-on-surface">{tr.privacyPolicy}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-lg">
              open_in_new
            </span>
          </a>
          <a
            href="mailto:support@salatzeit.de"
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <span className="font-title-md text-on-surface">{tr.helpFeedback}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-lg">mail</span>
          </a>
          <div className="p-4 flex items-center justify-between opacity-60">
            <span className="font-title-md">{tr.appVersion}</span>
            <span className="font-label-caps">v{APP_VERSION}</span>
          </div>
        </div>
      </section>

      {/* Decorative Footer */}
      <div className="pt-8 pb-12 flex flex-col items-center justify-center gap-2 opacity-30">
        <span className="material-symbols-outlined text-4xl text-secondary material-symbols-filled">
          mosque
        </span>
        <p className="font-label-caps text-[10px] tracking-[0.3em]">{tr.settingsFooterTagline}</p>
      </div>
    </main>
  );
}
