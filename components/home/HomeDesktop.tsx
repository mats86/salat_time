'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { de, ar, enUS } from 'date-fns/locale';
import { useLang } from '@/components/providers/LangProvider';
import { Spinner } from '@/components/ui/Spinner';
import {
  getAppBrandName,
  getMosqueName,
  getPrayerLabel,
} from '@/lib/i18n';
import { cn, formatCountdownShort, formatTime12 } from '@/lib/utils';
import type { HijriDate, Lang, MergedPrayerTime, Mosque, PrayerName } from '@/types';

const HOME_HERO_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDEKeyco3bnCrbXyXmk__mN4Df4IkbgbKvVh4Pr8D85BngwE3wEHQlhOHatyj96hMqoe6SKIDuPmtgfzdOQXwrA2svL6nl-debUC_rZ9vbxvmV0R9ZkkDT4Go6At2hL-EubHf8LiWLPh-cdDfGyS2AaYbQUFKY4nHnbvCaQJfIUaRbJwYiebhPwM81CF9DPya4Z3cufugDn7ZM_O7v_AUihsT_v3p5Wrk2rUXZD7elTuswqCXb5g-NMvomZsPoYCo09lkc13KwdDWcz';

const HOME_MAP_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAOwZrPqyrcP4yIctib4Y3B2rkytbdDQwwHKGCyMWBEyahhp5vgb4P2YtDKKCKOMeJVMHg8eqtSEFhVX1bU5E69TyUEnNjJVrDKw1Ua0y3z9PSrJA518NV3N2NlaXm06KcViXHd4hagKV5kpae3sMnHfrsppeNWn4LnWhUDOzJ_QzbDXc4B2HAGqtTUCWTsBlUtE-WgDesFlBFWpX7aG5-XE6T8loFu0vagVwWlEqnZMW3PiiFlIDyV3LYxhf41p2okqKEPP0jfrK0c';

const DATE_LOCALES = { de, ar, en: enUS };

const DESKTOP_PRAYER_ICONS: Record<string, string> = {
  Fajr: 'wb_twilight',
  Sunrise: 'light_mode',
  Dhuhr: 'sunny',
  Asr: 'wb_sunny',
  Maghrib: 'bedtime',
  Isha: 'dark_mode',
};

const langs: Lang[] = ['de', 'ar', 'en'];

interface HomeDesktopProps {
  coordsLabel?: string;
  hijri: HijriDate | null;
  countdown: string;
  nextPrayer: { name: PrayerName; time: string } | null;
  schedule: MergedPrayerTime[];
  loading: boolean;
  mosques: Mosque[];
  mosquesLoading: boolean;
  onOpenLocation: () => void;
}

export function HomeDesktop({
  coordsLabel,
  hijri,
  countdown,
  nextPrayer,
  schedule,
  loading,
  mosques,
  mosquesLoading,
  onOpenLocation,
}: HomeDesktopProps) {
  const { lang, setLang, tr } = useLang();
  const brandName = getAppBrandName(lang);
  const langIndex = langs.indexOf(lang);

  const cycleLang = () => {
    setLang(langs[(langIndex + 1) % langs.length]);
  };

  const countdownParts = countdown.split(':').map(Number);
  let countdownShort = countdown;
  if (countdownParts.length === 3) {
    const [h, m, s] = countdownParts;
    countdownShort = formatCountdownShort(h * 3600 + m * 60 + s);
  }

  const hijriLabel = hijri
    ? `${hijri.day} ${hijri.month} ${hijri.year} ${tr.hijriSuffix}`
    : `14 Ramadān 1445 ${tr.hijriSuffix}`;

  const gregorianLabel = format(new Date(), 'EEEE, d MMMM yyyy', {
    locale: DATE_LOCALES[lang],
  });

  const calendarSub = hijri
    ? `${format(new Date(), 'MMMM', { locale: DATE_LOCALES[lang] }).toUpperCase()} – ${hijri.month.toUpperCase()}`
    : format(new Date(), 'MMMM yyyy', { locale: DATE_LOCALES[lang] }).toUpperCase();

  const nextJamaahPrayer = schedule.find((p) => !p.isPast && p.name !== 'Sunrise');
  const jamaahLabel = nextJamaahPrayer
    ? `${tr.nextJamaah} (${getPrayerLabel(lang, nextJamaahPrayer.name).toUpperCase()})`
    : tr.nextJamaah;

  const jamaahTime = nextJamaahPrayer ? formatTime12(nextJamaahPrayer.time) : '—';

  return (
    <div className="hidden md:block bg-background text-on-background font-body-lg geometric-bg min-h-screen selection:bg-secondary selection:text-on-secondary">
      <header className="bg-surface/40 backdrop-blur-lg shadow-sm flex justify-between items-center w-full px-margin-desktop py-4 sticky top-0 z-50">
        <div className="font-headline-lg text-headline-lg text-primary tracking-tight">
          {brandName}
        </div>
        <nav className="flex items-center gap-stack-lg">
          <a
            href="#"
            className="font-title-md text-title-md text-secondary border-b-2 border-secondary pb-1 active:scale-95 transition-transform"
          >
            {tr.navPrayerTimes}
          </a>
          <a
            href="#mosques"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300 active:scale-95 transition-transform"
          >
            {tr.mosques}
          </a>
          <a
            href="#qibla"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300 active:scale-95 transition-transform"
          >
            {tr.qibla}
          </a>
          <Link
            href="/auth/login"
            className="font-title-md text-title-md text-on-surface-variant hover:text-secondary transition-colors duration-300 active:scale-95 transition-transform"
          >
            {tr.navCommunity}
          </Link>
        </nav>
        <div className="flex items-center gap-stack-md">
          <button
            type="button"
            onClick={cycleLang}
            className="material-symbols-outlined text-primary hover:text-secondary transition-colors active:scale-90"
            aria-label="Language"
          >
            language
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-margin-desktop py-stack-lg">
        <section className="relative rounded-xl overflow-hidden mb-stack-lg min-h-[400px] flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={HOME_HERO_IMAGE}
              alt=""
              fill
              className="object-cover brightness-50"
              priority
              sizes="1200px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container/80 via-primary-container/40 to-transparent" />
          </div>
          <div className="relative z-10 w-full p-stack-lg flex flex-row justify-between items-center gap-stack-lg">
            <div className="max-w-xl">
              <button
                type="button"
                onClick={onOpenLocation}
                className="flex items-center gap-2 mb-stack-sm hover:opacity-80 transition-opacity text-start"
              >
                <span
                  className="material-symbols-outlined text-secondary text-lg material-symbols-filled"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  location_on
                </span>
                <span className="font-label-caps text-label-caps text-primary tracking-widest">
                  {(coordsLabel ?? '—').toUpperCase()}
                </span>
              </button>
              {loading || !nextPrayer ? (
                <Spinner />
              ) : (
                <>
                  <h1 className="font-display-lg text-display-lg text-secondary mb-2 animate-pulse">
                    {getPrayerLabel(lang, nextPrayer.name)} {tr.in} {countdownShort}
                  </h1>
                  <p className="font-title-md text-title-md text-on-surface-variant">
                    {tr.heroReflection}
                  </p>
                </>
              )}
            </div>
            <div className="glass-card p-6 rounded-xl border border-outline-variant/30 text-right shrink-0">
              <p className="font-headline-lg text-headline-lg text-on-surface mb-1">{hijriLabel}</p>
              <p className="font-body-lg text-body-lg text-primary">{gregorianLabel}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-12 gap-gutter">
          <div className="col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-headline-lg text-headline-lg text-primary">{tr.todaySchedule}</h2>
              <button
                type="button"
                className="font-label-caps text-label-caps text-secondary hover:underline transition-all"
              >
                {tr.fullTimetable}
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {schedule.map((prayer) => {
                  const label = getPrayerLabel(lang, prayer.name);
                  const dimmed = prayer.isPast && !prayer.isCurrent;
                  const isSunrise = prayer.name === 'Sunrise';

                  if (prayer.isCurrent) {
                    return (
                      <div
                        key={prayer.name}
                        className="active-prayer-glow glass-card prayer-row-transition p-4 rounded-lg flex items-center justify-between relative overflow-hidden"
                      >
                        <div className="absolute inset-y-0 left-0 w-1 bg-secondary" />
                        <div className="flex items-center gap-4">
                          <span
                            className="material-symbols-outlined text-secondary material-symbols-filled"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {DESKTOP_PRAYER_ICONS[prayer.name]}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md text-on-surface">{label}</span>
                            <span className="font-label-caps text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full inline-block mt-1 w-fit">
                              {tr.current}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-title-md text-title-md text-secondary">
                            {formatTime12(prayer.time)}
                          </span>
                          <span
                            className="material-symbols-outlined text-secondary material-symbols-filled"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            notifications_active
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={prayer.name}
                      className={cn(
                        'glass-card prayer-row-transition p-4 rounded-lg flex items-center justify-between group hover:bg-surface-container-high',
                        dimmed && 'opacity-60'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
                          {DESKTOP_PRAYER_ICONS[prayer.name]}
                        </span>
                        <span className="font-title-md text-title-md">{label}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={cn(
                            'font-title-md text-title-md',
                            dimmed ? 'text-on-surface-variant' : 'text-on-surface'
                          )}
                        >
                          {formatTime12(prayer.time)}
                        </span>
                        {!isSunrise && (
                          <span
                            className={cn(
                              'material-symbols-outlined text-sm',
                              dimmed
                                ? 'text-outline-variant'
                                : 'text-on-surface-variant cursor-pointer hover:text-secondary transition-colors'
                            )}
                          >
                            {dimmed ? 'notifications_off' : 'notifications'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-5 flex flex-col gap-6">
            <div id="mosques" className="glass-card p-stack-md rounded-xl scroll-mt-24 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-md text-title-md text-primary">{tr.mosquesNearYou}</h3>
                <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-secondary">
                  map
                </span>
              </div>
              {mosquesLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : mosques.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.noMosques}</p>
              ) : (
                <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory -mx-stack-md px-stack-md pb-1">
                  {mosques.map((mosque) => {
                    const name = getMosqueName(mosque, lang);
                    return (
                      <div
                        key={mosque.id}
                        className="flex-shrink-0 w-full min-w-full snap-center"
                      >
                        <div className="relative rounded-lg overflow-hidden h-32 mb-4">
                          <Image
                            src={HOME_MAP_IMAGE}
                            alt={name}
                            fill
                            className="object-cover brightness-75"
                            unoptimized
                          />
                          {mosque.distance_km != null && (
                            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-outline-variant/30">
                              <span className="font-label-caps text-label-caps text-secondary">
                                {mosque.distance_km.toFixed(1)} {tr.kmAway}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center gap-2">
                            <Link
                              href={`/mosque/${mosque.id}`}
                              className="font-title-md text-title-md text-on-surface hover:text-secondary transition-colors line-clamp-2"
                            >
                              {name}
                            </Link>
                            <span className="font-label-caps text-label-caps text-tertiary shrink-0">
                              {tr.open}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-primary-container rounded-lg border border-primary/10 gap-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-label-caps text-[10px] text-on-primary-container opacity-70 truncate">
                                {jamaahLabel}
                              </span>
                              <span className="font-title-md text-title-md text-secondary">
                                {jamaahTime}
                              </span>
                            </div>
                            {mosque.latitude != null && mosque.longitude != null && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-caps hover:scale-105 transition-transform active:scale-95 shrink-0"
                              >
                                {tr.directions.toUpperCase()}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div id="qibla" className="grid grid-cols-2 gap-4 scroll-mt-24">
              <div className="glass-card p-stack-md rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-secondary transition-colors active:scale-95 border border-transparent">
                <span className="material-symbols-outlined text-secondary text-4xl mb-2">explore</span>
                <span className="font-title-md text-title-md">{tr.qiblaFinder}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant mt-1">
                  {tr.qiblaDirection}
                </span>
              </div>
              <div className="glass-card p-stack-md rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-secondary transition-colors active:scale-95 border border-transparent">
                <span className="material-symbols-outlined text-secondary text-4xl mb-2">
                  calendar_month
                </span>
                <span className="font-title-md text-title-md">{tr.viewCalendar}</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant mt-1">
                  {calendarSub}
                </span>
              </div>
              <div className="col-span-2 glass-card p-4 rounded-xl flex items-center justify-between group cursor-pointer border border-transparent hover:border-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-tertiary material-symbols-filled"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      book_2
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md">{tr.dailyDhikr}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {tr.dailyDhikrSub}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                  chevron_right
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant w-full py-stack-lg px-margin-desktop flex flex-row justify-between items-center gap-stack-md mt-stack-lg">
        <div className="flex flex-col gap-2">
          <div className="font-title-md text-title-md text-primary">{brandName}</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.footerCopyright}</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-stack-md">
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-opacity duration-200"
          >
            {tr.privacyPolicy}
          </a>
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-opacity duration-200"
          >
            {tr.termsOfService}
          </a>
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-opacity duration-200"
          >
            {tr.contactUs}
          </a>
          <a
            href="#"
            className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-opacity duration-200"
          >
            {tr.support}
          </a>
        </nav>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-on-surface-variant hover:text-secondary cursor-pointer">
            face_nod
          </span>
          <button
            type="button"
            onClick={cycleLang}
            className="material-symbols-outlined text-on-surface-variant hover:text-secondary cursor-pointer"
            aria-label="Language"
          >
            language
          </button>
          <span className="material-symbols-outlined text-on-surface-variant hover:text-secondary cursor-pointer">
            alternate_email
          </span>
        </div>
      </footer>
    </div>
  );
}
