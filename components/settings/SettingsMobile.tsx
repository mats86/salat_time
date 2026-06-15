'use client';

import { useState } from 'react';
import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { getPrayerLabel, getCalcMethodLabel, getAsrSchoolLabel, getLatitudeAdjustLabel } from '@/lib/i18n';
import { PRAYER_ALERT_NAMES } from '@/lib/prayer-alerts';
import {
  CALC_METHOD_OPTIONS,
  LATITUDE_ADJUST_OPTIONS,
  setAsrSchool,
  setCalcMethod,
  setLatitudeAdjustment,
  type AsrSchool,
} from '@/lib/calc-settings';
import { useCalcSettings } from '@/hooks/useCalcSettings';
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
  const { settings } = useCalcSettings();
  const [methodExpanded, setMethodExpanded] = useState(false);
  const [latitudeExpanded, setLatitudeExpanded] = useState(false);

  const methodLabel = getCalcMethodLabel(lang, settings.method);
  const asrLabel = getAsrSchoolLabel(lang, settings.school);
  const latitudeLabel = getLatitudeAdjustLabel(lang, settings.latitudeAdjust);

  const toggleAsrSchool = () => {
    const next: AsrSchool = settings.school === 'standard' ? 'hanafi' : 'standard';
    setAsrSchool(next);
  };

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
          <button
            type="button"
            onClick={() => setMethodExpanded((open) => !open)}
            className="w-full p-4 flex items-center justify-between settings-gold-glow transition-all group text-left"
          >
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface">{tr.calculationMethod}</span>
              <span className="text-xs text-on-surface-variant">{methodLabel}</span>
            </div>
            <span
              className={cn(
                'material-symbols-outlined text-secondary opacity-60 transition-transform',
                methodExpanded && 'rotate-180'
              )}
            >
              expand_more
            </span>
          </button>
          {methodExpanded && (
            <div className="bg-surface-container-low/40 divide-y divide-white/5">
              {CALC_METHOD_OPTIONS.map((option) => {
                const selected = settings.method === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setCalcMethod(option.id);
                      setMethodExpanded(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors',
                      selected
                        ? 'bg-secondary/15 text-secondary'
                        : 'text-on-surface-variant hover:bg-white/5'
                    )}
                  >
                    <span className="text-sm font-title-md">{tr[option.labelKey]}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setLatitudeExpanded((open) => !open)}
            className="w-full p-4 flex items-center justify-between settings-gold-glow transition-all group text-left"
          >
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface">{tr.highLatitudeRule}</span>
              <span className="text-xs text-on-surface-variant">{latitudeLabel}</span>
            </div>
            <span
              className={cn(
                'material-symbols-outlined text-secondary opacity-60 transition-transform',
                latitudeExpanded && 'rotate-180'
              )}
            >
              expand_more
            </span>
          </button>
          {latitudeExpanded && (
            <div className="bg-surface-container-low/40 divide-y divide-white/5">
              <p className="px-4 pt-3 pb-1 text-xs text-on-surface-variant">{tr.highLatitudeHint}</p>
              {LATITUDE_ADJUST_OPTIONS.map((option) => {
                const selected = settings.latitudeAdjust === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setLatitudeAdjustment(option.id);
                      setLatitudeExpanded(false);
                    }}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-colors',
                      selected
                        ? 'bg-secondary/15 text-secondary'
                        : 'text-on-surface-variant hover:bg-white/5'
                    )}
                  >
                    <span className="text-sm font-title-md block">{tr[option.labelKey]}</span>
                    <span className="text-xs opacity-70 mt-0.5 block">{tr[option.descKey]}</span>
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={toggleAsrSchool}
            className="w-full p-4 flex items-center justify-between settings-gold-glow transition-all text-left"
          >
            <div className="flex flex-col">
              <span className="font-title-md text-on-surface">{tr.asrJuristicMethod}</span>
              <span className="text-xs text-on-surface-variant">{asrLabel}</span>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-60">chevron_right</span>
          </button>
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
