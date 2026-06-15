'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName, getPrayerLabel } from '@/lib/i18n';
import { SettingsDesktopNotificationRow } from '@/components/settings/SettingsDesktopNotificationRow';
import { resetAllPrayerAlerts } from '@/lib/prayer-alerts';
import { cn } from '@/lib/utils';

const APP_VERSION = '2.4.0';

const QR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCYy3aTWIuV5oCTb4gstrY4Oy0N_lhEJ92vaSM22Qw1N2sy9xeN7gnR_qPsq2GWEbJ9zqePnSicIuzjzjqJ83y-SY_G7C6IQTXj8Z_hwbe1Y8HaRbHZcLJWYCBfFyfbu_xwEJ5TzTML2PqErS9VCxOPl4ax_iAe8C_XaqVOLvXAohgUgLBaBqDOtPwYwyuxjJ_XjP4QOzikIIkOO2iKmonm4fT-GjvNv4ckhNeZ34_2mryCW7SMWGePU3c9LsEp7zGPV1lw0NywE7OC';

const langs: Lang[] = ['de', 'ar', 'en'];

const SIDEBAR_SECTIONS = [
  { id: 'general', icon: 'settings', labelKey: 'settingsGeneral' as const },
  { id: 'calculation', icon: 'calculate', labelKey: 'settingsPrayerCalculations' as const },
  { id: 'notifications', icon: 'notifications_active', labelKey: 'settingsNotifications' as const },
  { id: 'account', icon: 'person', labelKey: 'settingsAccount' as const },
  { id: 'support', icon: 'help_center', labelKey: 'settingsSupportAbout' as const },
];

const SCROLL_SECTIONS = ['general', 'calculation', 'notifications', 'support'];

const LANG_CARDS: {
  code: Lang;
  display: string;
  labelKey: 'langEnglish' | 'langDeutsch' | 'langArabicLabel';
}[] = [
  { code: 'en', display: 'EN', labelKey: 'langEnglish' },
  { code: 'de', display: 'DE', labelKey: 'langDeutsch' },
  { code: 'ar', display: 'العربية', labelKey: 'langArabicLabel' },
];

const CALCULATION_METHODS = [
  'calcMethodMWL',
  'calcMethodISNA',
  'calcMethodEgypt',
  'calcMethodUmmAlQura',
  'calcMethodKarachi',
] as const;

export function SettingsDesktop() {
  const { lang, setLang, tr } = useLang();
  const brandName = getAppBrandName(lang);
  const [activeSection, setActiveSection] = useState('general');
  const [asrMethod, setAsrMethod] = useState<'standard' | 'hanafi'>('standard');
  const [calcMethod, setCalcMethod] = useState(0);

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  useEffect(() => {
    const onScroll = () => {
      let current = SCROLL_SECTIONS[0];
      for (const section of SCROLL_SECTIONS) {
        const el = document.getElementById(section);
        if (el && window.scrollY >= el.offsetTop - 150) {
          current = section;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="hidden md:flex flex-col min-h-screen bg-background text-on-background font-body-lg selection:bg-secondary/30">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop h-20 bg-surface-container/40 backdrop-blur-xl border-b border-outline-variant/20">
        <Link href="/" className="font-display-lg text-display-lg text-primary tracking-tight">
          {brandName}
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300"
          >
            {tr.navPrayerTimes}
          </Link>
          <Link
            href="/#mosques"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300"
          >
            {tr.mosques}
          </Link>
          <Link
            href="/qibla"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300"
          >
            {tr.qibla}
          </Link>
          <Link
            href="/auth/login"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300"
          >
            {tr.navCommunity}
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={cycleLang}
            className="p-2 text-primary hover:opacity-80 transition-all"
            aria-label="Language"
          >
            <span className="material-symbols-outlined">language</span>
          </button>
          <button
            type="button"
            className="p-2 text-primary hover:opacity-80 transition-all"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <Link
            href="/settings"
            className="p-2 text-secondary border-b-2 border-secondary pb-1 transition-all"
            aria-label={tr.settings}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-margin-desktop min-h-screen max-w-[1400px] mx-auto grid grid-cols-12 gap-gutter">
        {/* Sidebar Navigation */}
        <aside className="col-span-3">
          <div className="glass-card sticky top-32 rounded-xl p-stack-md flex flex-col gap-2">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant px-4 mb-4 uppercase tracking-widest">
              {tr.settings}
            </h2>
            {SIDEBAR_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                className={cn(
                  'settings-sidebar-link flex items-center gap-3 px-4 py-3 rounded-lg font-title-md transition-all text-left w-full',
                  activeSection === item.id
                    ? 'active'
                    : 'text-on-surface-variant hover:text-secondary'
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {tr[item.labelKey]}
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <section className="col-span-9 flex flex-col gap-stack-lg">
          <div className="mb-4">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              {tr.settingsPreferences}
            </h1>
            <p className="font-body-sm text-on-surface-variant max-w-2xl">
              {tr.settingsPreferencesDesc}
            </p>
          </div>

          {/* Language Selection */}
          <div className="glass-card rounded-xl p-stack-lg scroll-mt-32" id="general">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary">translate</span>
              <h3 className="font-title-md text-title-md text-on-surface">
                {tr.settingsLanguageSelection}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-gutter">
              {LANG_CARDS.map(({ code, display, labelKey }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={cn(
                    'glass-card rounded-lg p-6 flex flex-col items-center justify-center gap-3 group transition-all',
                    lang === code && 'active-glow'
                  )}
                >
                  <span
                    className={cn(
                      'font-display-lg text-3xl',
                      lang === code ? 'text-secondary' : 'text-primary'
                    )}
                  >
                    {display}
                  </span>
                  <span className="font-title-md text-on-surface">{tr[labelKey]}</span>
                  <span
                    className={cn(
                      'font-label-caps text-on-surface-variant',
                      lang === code ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'
                    )}
                  >
                    {lang === code ? tr.langSystemDefault : tr.langSelect}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prayer Calculation */}
          <div className="glass-card rounded-xl p-stack-lg scroll-mt-32" id="calculation">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary">auto_awesome</span>
              <h3 className="font-title-md text-title-md text-on-surface">
                {tr.settingsPrayerCalculation}
              </h3>
            </div>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <label className="font-label-caps text-on-surface-variant">
                  {tr.calculationMethod}
                </label>
                <div className="relative">
                  <select
                    value={calcMethod}
                    onChange={(e) => setCalcMethod(Number(e.target.value))}
                    className="w-full bg-surface-container-low border-b-2 border-primary/30 text-on-surface py-3 px-4 focus:border-secondary focus:ring-0 transition-all appearance-none cursor-pointer rounded-lg"
                  >
                    {CALCULATION_METHODS.map((key, i) => (
                      <option key={key} value={i}>
                        {tr[key]}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none">
                    expand_more
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant italic">{tr.calcMethodMWLDesc}</p>
              </div>
              <div className="flex flex-col gap-4">
                <label className="font-label-caps text-on-surface-variant">
                  {tr.asrJuristicMethod}
                </label>
                <div className="grid grid-cols-2 gap-gutter">
                  <label className="relative cursor-pointer group">
                    <input
                      type="radio"
                      name="asr_method"
                      className="hidden peer"
                      checked={asrMethod === 'standard'}
                      onChange={() => setAsrMethod('standard')}
                    />
                    <div className="glass-card p-4 rounded-lg peer-checked:active-glow border border-transparent transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-title-md">{tr.asrJuristicStandard}</span>
                        <span
                          className={cn(
                            'material-symbols-outlined text-secondary material-symbols-filled',
                            asrMethod === 'standard' ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          check_circle
                        </span>
                      </div>
                      <span className="text-body-sm text-on-surface-variant">
                        {tr.asrStandardDesc}
                      </span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer group">
                    <input
                      type="radio"
                      name="asr_method"
                      className="hidden peer"
                      checked={asrMethod === 'hanafi'}
                      onChange={() => setAsrMethod('hanafi')}
                    />
                    <div className="glass-card p-4 rounded-lg peer-checked:active-glow border border-transparent transition-all">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-title-md">{tr.asrHanafi}</span>
                        <span
                          className={cn(
                            'material-symbols-outlined text-secondary material-symbols-filled',
                            asrMethod === 'hanafi' ? 'opacity-100' : 'opacity-0'
                          )}
                        >
                          check_circle
                        </span>
                      </div>
                      <span className="text-body-sm text-on-surface-variant">
                        {tr.asrHanafiDesc}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card rounded-xl p-stack-lg scroll-mt-32" id="notifications">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary">notifications_active</span>
                <h3 className="font-title-md text-title-md text-on-surface">
                  {tr.prayerAlertsAdhan}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => resetAllPrayerAlerts()}
                className="text-primary-fixed hover:text-secondary transition-colors font-label-caps underline underline-offset-4"
              >
                {tr.resetAll}
              </button>
            </div>
            <div className="space-y-4">
              <SettingsDesktopNotificationRow
                prayer="Fajr"
                icon="wb_twilight"
                title={getPrayerLabel(lang, 'Fajr')}
                subtitle={tr.fajrDesc}
                soundLabel={tr.adhanMishary}
              />
              <SettingsDesktopNotificationRow
                prayer="Dhuhr"
                icon="wb_sunny"
                title={getPrayerLabel(lang, 'Dhuhr')}
                subtitle={tr.dhuhrDesc}
                soundLabel={tr.standardBeep}
                soundIcon="notifications"
                soundMuted
              />
              <SettingsDesktopNotificationRow
                prayer="Asr"
                icon="partly_cloudy_day"
                title={getPrayerLabel(lang, 'Asr')}
                subtitle={tr.asrDesc}
                dimmed
              />
              <SettingsDesktopNotificationRow
                prayer="Maghrib"
                icon="nights_stay"
                title={getPrayerLabel(lang, 'Maghrib')}
                subtitle={tr.maghribDesc}
              />
              <SettingsDesktopNotificationRow
                prayer="Isha"
                icon="bedtime"
                title={getPrayerLabel(lang, 'Isha')}
                subtitle={tr.ishaDesc}
              />
            </div>
          </div>

          {/* Account */}
          <div className="glass-card rounded-xl p-stack-lg scroll-mt-32" id="account">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-secondary">person</span>
              <h3 className="font-title-md text-title-md text-on-surface">{tr.settingsAccount}</h3>
            </div>
            <p className="font-body-sm text-on-surface-variant mb-4">{tr.settingsAccountDesc}</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-stack-lg py-3 rounded-full font-title-md hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined">login</span>
              {tr.login}
            </Link>
          </div>

          {/* Support & About */}
          <div
            className="glass-card rounded-xl p-stack-lg border-t-4 border-secondary/30 scroll-mt-32"
            id="support"
          >
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-secondary">info</span>
              <h3 className="font-title-md text-title-md text-on-surface">
                {tr.settingsSupportAbout}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-gutter">
              <a
                href="#"
                className="flex items-center justify-between p-4 glass-card rounded-lg hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <span className="font-title-md">{tr.termsOfService}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </a>
              <a
                href="#"
                className="flex items-center justify-between p-4 glass-card rounded-lg hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary">privacy_tip</span>
                  <span className="font-title-md">{tr.privacyPolicy}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </a>
              <a
                href="mailto:support@salatzeit.de"
                className="flex items-center justify-between p-4 glass-card rounded-lg hover:border-primary transition-all group"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary">help</span>
                  <span className="font-title-md">{tr.helpFeedback}</span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </a>
              <div className="flex items-center justify-between p-4 glass-card rounded-lg border-dashed border-outline-variant/30">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-secondary">deployed_code</span>
                  <div>
                    <span className="font-title-md block">
                      {tr.versionLabel} {APP_VERSION}
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      {tr.versionStableRelease}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 flex justify-center">
              <Image
                src={QR_IMAGE}
                alt=""
                width={128}
                height={128}
                className="w-32 h-32 rounded-lg glass-card p-2"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-stack-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-gutter bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-display-lg text-headline-lg text-primary">{brandName}</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.footerCrafted}</p>
        </div>
        <div className="flex gap-8">
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors"
          >
            {tr.privacyPolicy}
          </a>
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors"
          >
            {tr.termsOfService}
          </a>
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors"
          >
            {tr.cookiePolicy}
          </a>
          <a
            href="mailto:support@salatzeit.de"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors"
          >
            {tr.support}
          </a>
        </div>
      </footer>
    </div>
  );
}
