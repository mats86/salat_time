'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { de, ar, enUS } from 'date-fns/locale';
import { useLang } from '@/components/providers/LangProvider';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import {
  getAppBrandName,
  getEventTitle,
  getMosqueName,
  getPrayerLabel,
} from '@/lib/i18n';
import {
  getMosqueImage,
  MOSQUE_MAP_PLACEHOLDER,
  MOSQUE_MOBILE_HERO,
  MOSQUE_MOBILE_MAP_PLACEHOLDER,
} from '@/lib/mosque-images';
import { cn, formatTime12 } from '@/lib/utils';
import type { Lang, Mosque, MosqueEvent, MosquePrayerTimes, PrayerName } from '@/types';

const PRAYER_ROWS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const DESKTOP_PRAYER_ICONS: Record<string, string> = {
  Fajr: 'brightness_2',
  Dhuhr: 'wb_sunny',
  Asr: 'sunny_snowing',
  Maghrib: 'wb_twilight',
  Isha: 'nights_stay',
};

const MOBILE_PRAYER_ICONS: Record<string, string> = {
  Fajr: 'wb_twilight',
  Dhuhr: 'sunny',
  Asr: 'wb_sunny',
  Maghrib: 'dark_mode',
  Isha: 'bedtime',
};

const DATE_LOCALES = { de, ar, en: enUS };

const DESKTOP_FACILITIES = [
  { key: 'has_women_area' as const, labelKey: 'womenArea' as const, icon: 'woman' },
  { key: 'has_parking' as const, labelKey: 'parkingAvailable' as const, icon: 'local_parking' },
  { key: 'has_wudu' as const, labelKey: 'wuduFacilities' as const, icon: 'wash' },
  { key: 'has_wheelchair' as const, labelKey: 'wheelchairAccess' as const, icon: 'accessible' },
];

const MOBILE_FACILITIES = [
  { key: 'has_women_area' as const, labelKey: 'womenAreaShort' as const, icon: 'female' },
  { key: 'has_parking' as const, labelKey: 'parkingShort' as const, icon: 'local_parking' },
  { key: 'has_wudu' as const, labelKey: 'wuduAreaShort' as const, icon: 'wash' },
  { key: 'has_wheelchair' as const, labelKey: 'wheelchairShort' as const, icon: 'accessible' },
];

interface MosqueDetailClientProps {
  mosque: Mosque;
  mosquePrayerTimes: MosquePrayerTimes | null;
  events: MosqueEvent[];
}

function getCurrentPrayer(timings: Record<string, string>): PrayerName | null {
  const now = new Date();
  let current: PrayerName | null = null;
  for (const name of PRAYER_ROWS) {
    const [h, m] = timings[name].split(':').map(Number);
    const t = new Date();
    t.setHours(h, m, 0, 0);
    if (t <= now) current = name;
  }
  return current;
}

function formatTime24(time: string): string {
  if (time === '—') return '—';
  return time.slice(0, 5);
}

function formatEventWhen(event: MosqueEvent, lang: Lang): string {
  if (event.is_recurring && event.recurrence) return event.recurrence;
  if (!event.event_date) return '';
  const date = new Date(event.event_date);
  const day = format(date, 'EEEE', { locale: DATE_LOCALES[lang] });
  const time = event.event_time ? formatTime12(event.event_time.slice(0, 5)) : '';
  return time ? `${day}, ${time}` : day;
}

function getEventDateParts(event: MosqueEvent, lang: Lang) {
  if (!event.event_date) return null;
  const date = new Date(event.event_date);
  return {
    month: format(date, 'MMM', { locale: DATE_LOCALES[lang] }).toUpperCase().slice(0, 3),
    day: format(date, 'd'),
  };
}

export function MosqueDetailClient({
  mosque,
  mosquePrayerTimes,
  events,
}: MosqueDetailClientProps) {
  const { lang, setLang, tr } = useLang();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const brandName = getAppBrandName(lang);
  const name = getMosqueName(mosque, lang);
  const desktopImageUrl = mosque.image ?? getMosqueImage(mosque.name);
  const mobileImageUrl = mosque.image ?? MOSQUE_MOBILE_HERO;

  const lat = mosque.latitude ?? undefined;
  const lng = mosque.longitude ?? undefined;
  const { timings, loading: prayerLoading } = usePrayerTimes(lat, lng);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mosque.id]);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll('.mosque-detail-glass');
    cards.forEach((card, index) => {
      const el = card as HTMLElement;
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s`;
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 100);
    });
  }, [mosque.id]);

  const mapsUrl =
    lat != null && lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : null;

  const addressLine = [mosque.address, mosque.city].filter(Boolean).join(', ');
  const todayLabelDesktop = format(new Date(), 'EEEE, d MMM', { locale: DATE_LOCALES[lang] });
  const todayLabelMobile = format(new Date(), 'MMMM d, yyyy', { locale: DATE_LOCALES[lang] });
  const currentPrayer = timings ? getCurrentPrayer(timings) : null;

  const mergedPrayers = PRAYER_ROWS.map((prayerName) => {
    const key = prayerName.toLowerCase() as keyof MosquePrayerTimes;
    const mosqueTime = mosquePrayerTimes?.[key];
    const locationTime = timings?.[prayerName];
    const mosqueTimeStr = typeof mosqueTime === 'string' ? mosqueTime.slice(0, 5) : null;
    const adhanTime = locationTime ?? '—';
    const jamahTime = mosqueTimeStr ?? locationTime ?? '—';
    return {
      name: prayerName,
      label: getPrayerLabel(lang, prayerName),
      adhanTime,
      jamahTime,
      isActive: currentPrayer === prayerName,
    };
  });

  const langs: Lang[] = ['de', 'ar', 'en'];
  const langIndex = langs.indexOf(lang);

  const cycleLang = () => {
    setLang(langs[(langIndex + 1) % langs.length]);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: name, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url).catch(() => undefined);
    }
  };

  const openForLabel = currentPrayer
    ? `${tr.openFor} ${getPrayerLabel(lang, currentPrayer)}`
    : null;

  return (
    <div className="bg-background text-on-surface font-body-lg overflow-x-hidden selection:bg-secondary/30 min-h-screen">
      {/* ── MOBILE ── */}
      <div className="md:hidden pb-32">
        <header
          className={cn(
            'fixed top-0 left-0 w-full z-50 flex items-center justify-between px-margin-mobile h-16 transition-all duration-200',
            headerScrolled
              ? 'bg-background/90 backdrop-blur-lg'
              : 'bg-gradient-to-b from-surface-container-lowest to-transparent'
          )}
        >
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label={tr.back}
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </Link>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
            {tr.mosqueDetail}
          </h1>
          <button
            type="button"
            onClick={cycleLang}
            className="w-10 h-10 flex items-center justify-center hover:opacity-80 transition-opacity"
            aria-label="Language"
          >
            <span className="material-symbols-outlined text-primary">language</span>
          </button>
        </header>

        <main>
          <section className="relative h-[397px] w-full">
            <div className="absolute inset-0">
              <Image
                src={mobileImageUrl}
                alt={name}
                fill
                className="object-cover"
                priority
                sizes="100vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 w-full px-margin-mobile pb-6">
              {openForLabel && (
                <div className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-3 py-1 rounded-full mb-4">
                  <span
                    className="material-symbols-outlined text-[16px] material-symbols-filled"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    timer
                  </span>
                  <span className="font-label-caps text-label-caps">{openForLabel}</span>
                </div>
              )}
              <h2 className="font-display-lg text-[40px] leading-tight text-white mb-2">{name}</h2>
              {addressLine && (
                <div className="flex items-center gap-1 text-on-surface-variant mb-6">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span className="font-body-sm text-body-sm">{addressLine}</span>
                </div>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-secondary text-on-secondary py-4 rounded-xl font-title-md text-title-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                  <span className="material-symbols-outlined">directions</span>
                  {tr.getDirections}
                </a>
              )}
            </div>
          </section>

          <section className="px-margin-mobile mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                {tr.todaysJamah}
              </h3>
              <span className="font-label-caps text-label-caps text-secondary">{todayLabelMobile}</span>
            </div>
            {prayerLoading ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.loading}</p>
            ) : (
              <div className="space-y-3">
                {mergedPrayers.map((row) => (
                  <div
                    key={row.name}
                    className={cn(
                      'glass-card border-0 p-4 rounded-xl flex items-center justify-between relative overflow-hidden',
                      row.isActive && 'border border-secondary gold-glow bg-secondary/5'
                    )}
                  >
                    {row.isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-transparent pointer-events-none" />
                    )}
                    <div className="flex items-center gap-4 z-10">
                      <span
                        className={cn(
                          'material-symbols-outlined',
                          row.isActive ? 'text-secondary material-symbols-filled' : 'text-on-surface-variant'
                        )}
                        style={row.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                      >
                        {MOBILE_PRAYER_ICONS[row.name]}
                      </span>
                      <span
                        className={cn(
                          'font-title-md text-title-md',
                          row.isActive ? 'text-secondary' : 'text-on-surface'
                        )}
                      >
                        {row.label}
                      </span>
                    </div>
                    <div className="flex gap-8 text-right z-10">
                      <div>
                        <p
                          className={cn(
                            'font-label-caps text-[10px] mb-1',
                            row.isActive ? 'text-secondary' : 'text-on-surface-variant'
                          )}
                        >
                          {tr.adhan.toUpperCase()}
                        </p>
                        <p
                          className={cn(
                            'font-body-lg text-body-lg',
                            row.isActive && 'text-secondary'
                          )}
                        >
                          {formatTime24(row.adhanTime)}
                        </p>
                      </div>
                      <div>
                        <p
                          className={cn(
                            'font-label-caps text-[10px] mb-1',
                            row.isActive ? 'text-secondary' : 'text-on-surface-variant'
                          )}
                        >
                          {tr.iqamah}
                        </p>
                        <p
                          className={cn(
                            'font-body-lg text-body-lg',
                            row.isActive && 'text-secondary'
                          )}
                        >
                          {formatTime24(row.jamahTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h3 className="px-margin-mobile font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4">
              {tr.mosqueFacilities}
            </h3>
            <div className="flex overflow-x-auto gap-4 px-margin-mobile no-scrollbar">
              {MOBILE_FACILITIES.map((facility) => {
                const available = mosque[facility.key];
                return (
                  <div
                    key={facility.key}
                    className={cn(
                      'flex-shrink-0 flex flex-col items-center justify-center w-28 h-28 glass-card border-0 rounded-xl text-center p-2',
                      !available && 'opacity-40'
                    )}
                  >
                    <span className="material-symbols-outlined text-secondary text-3xl mb-2">
                      {facility.icon}
                    </span>
                    <span className="font-label-caps text-[10px] text-on-surface">
                      {tr[facility.labelKey]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="px-margin-mobile mt-10">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4">
              {tr.upcomingEvents}
            </h3>
            {events.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant glass-card border-0 p-4 rounded-xl">
                {tr.noUpcomingEvents}
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => {
                  const dateParts = getEventDateParts(event, lang);
                  return (
                    <div key={event.id} className="glass-card border-0 p-4 rounded-xl flex gap-4">
                      {dateParts && (
                        <div className="w-16 h-16 rounded-lg bg-primary-container flex flex-col items-center justify-center text-primary shrink-0 border border-primary/20">
                          <span className="font-label-caps text-[10px]">{dateParts.month}</span>
                          <span className="font-title-md text-xl">{dateParts.day}</span>
                        </div>
                      )}
                      <div>
                        <h4 className="font-title-md text-title-md text-white">
                          {getEventTitle(event, lang)}
                        </h4>
                        {event.description && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="px-margin-mobile mt-10">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-4">
              {tr.locationContact}
            </h3>
            {lat != null && lng != null && (
              <a
                href={mapsUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-48 rounded-xl overflow-hidden glass-card border border-outline-variant/30 mb-6 block relative"
              >
                <Image
                  src={MOSQUE_MOBILE_MAP_PLACEHOLDER}
                  alt={tr.location}
                  fill
                  className="object-cover grayscale opacity-60"
                  unoptimized
                />
              </a>
            )}
            <div className="space-y-4">
              {mosque.phone && (
                <a href={`tel:${mosque.phone}`} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                  </div>
                  <span className="font-body-lg text-body-lg">{mosque.phone}</span>
                </a>
              )}
              {mosque.website && (
                <a
                  href={mosque.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">language</span>
                  </div>
                  <span className="font-body-lg text-body-lg">
                    {mosque.website.replace(/^https?:\/\//, '')}
                  </span>
                </a>
              )}
              <div className="flex items-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors"
                  aria-label="Share"
                >
                  share
                </button>
                {mosque.website && (
                  <a
                    href={`mailto:info@${mosque.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}`}
                    className="material-symbols-outlined text-on-surface-variant hover:text-secondary transition-colors"
                    aria-label="Mail"
                  >
                    mail
                  </a>
                )}
              </div>
            </div>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-surface-container/40 backdrop-blur-xl rounded-t-xl shadow-lg shadow-secondary/10">
          <Link
            href="/"
            className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined mb-1">schedule</span>
            <span className="font-label-caps text-label-caps">{tr.navPrayer}</span>
          </Link>
          <Link
            href="/#mosques"
            className="flex flex-col items-center justify-center text-secondary bg-secondary-container/20 rounded-xl p-2 active:scale-95 transition-transform duration-150"
          >
            <span
              className="material-symbols-outlined mb-1 material-symbols-filled"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              mosque
            </span>
            <span className="font-label-caps text-label-caps">{tr.mosques}</span>
          </Link>
          <Link
            href="/#qibla"
            className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined mb-1">explore</span>
            <span className="font-label-caps text-label-caps">{tr.qibla}</span>
          </Link>
          <Link
            href="/auth/login"
            className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined mb-1">settings</span>
            <span className="font-label-caps text-label-caps">{tr.settings}</span>
          </Link>
        </nav>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block text-on-background min-h-screen pb-12">
        <header className="bg-surface/40 backdrop-blur-lg fixed top-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16">
          <Link
            href="/"
            className="font-display-lg text-display-lg text-secondary hover:opacity-90 transition-opacity"
          >
            {brandName}
          </Link>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleShare}
              className="text-on-surface-variant hover:bg-primary/10 transition-colors p-2 rounded-full active:scale-95 duration-200"
              aria-label="Share"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
            <button
              type="button"
              className="text-on-surface-variant hover:bg-primary/10 transition-colors p-2 rounded-full active:scale-95 duration-200"
              aria-label="Bookmark"
            >
              <span className="material-symbols-outlined">bookmark</span>
            </button>
            <button
              type="button"
              onClick={cycleLang}
              className="text-on-surface-variant hover:bg-primary/10 transition-colors p-2 rounded-full active:scale-95 duration-200"
              aria-label="Language"
            >
              <span className="material-symbols-outlined">translate</span>
            </button>
          </div>
        </header>

        <main className="mt-16 max-w-[1200px] mx-auto">
          <section className="relative h-[614px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <Image
              src={desktopImageUrl}
              alt={name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              unoptimized
            />
            <div className="absolute bottom-0 left-0 p-margin-desktop z-20 w-full">
              {openForLabel && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full border border-secondary/30 font-label-caps text-label-caps flex items-center gap-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    {openForLabel}
                  </span>
                </div>
              )}
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">{name}</h1>
              {addressLine && (
                <p className="font-body-lg text-body-lg text-on-surface-variant mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  {addressLine}
                </p>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary text-on-secondary px-6 py-3 rounded-xl font-title-md text-title-md inline-flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined">directions</span>
                  {tr.getDirections}
                </a>
              )}
            </div>
          </section>

          <div className="px-margin-desktop py-stack-lg grid grid-cols-12 gap-gutter">
            <div className="col-span-8 space-y-stack-lg">
              <section>
                <div className="flex justify-between items-end mb-stack-md">
                  <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                    {tr.todaysJamah}
                  </h2>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">
                    {todayLabelDesktop}
                  </p>
                </div>
                {prayerLoading ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.loading}</p>
                ) : (
                  <div className="space-y-3">
                    {mergedPrayers.map((row) => (
                      <div
                        key={row.name}
                        className={cn(
                          'mosque-detail-glass glass-card p-4 rounded-xl flex justify-between items-center relative overflow-hidden',
                          row.isActive && 'active-glow'
                        )}
                      >
                        {row.isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent pointer-events-none" />
                        )}
                        <div className="flex items-center gap-4 relative z-10">
                          <span
                            className={cn(
                              'material-symbols-outlined',
                              row.isActive ? 'text-secondary' : 'text-on-surface-variant'
                            )}
                          >
                            {DESKTOP_PRAYER_ICONS[row.name]}
                          </span>
                          <span
                            className={cn(
                              'font-title-md text-title-md',
                              row.isActive ? 'text-secondary' : 'text-on-surface'
                            )}
                          >
                            {row.label}
                          </span>
                        </div>
                        <div className="text-right relative z-10">
                          <p className="font-label-caps text-label-caps text-on-surface-variant">
                            {row.adhanTime !== '—' ? formatTime12(row.adhanTime) : '—'}
                          </p>
                          <p
                            className={cn(
                              row.isActive
                                ? 'font-display-lg text-[24px] text-secondary'
                                : 'font-title-md text-title-md text-on-surface'
                            )}
                          >
                            {row.jamahTime !== '—' ? formatTime12(row.jamahTime) : '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className="font-title-md text-title-md text-primary mb-stack-md">
                  {tr.mosqueFacilities}
                </h2>
                <div className="grid grid-cols-4 gap-4">
                  {DESKTOP_FACILITIES.map((facility) => {
                    const available = mosque[facility.key];
                    return (
                      <div
                        key={facility.key}
                        className={cn(
                          'mosque-detail-glass glass-card p-4 rounded-xl flex flex-col items-center gap-2 text-center group hover:bg-primary/5 transition-colors',
                          !available && 'opacity-40'
                        )}
                      >
                        <span className="material-symbols-outlined text-secondary text-3xl">
                          {facility.icon}
                        </span>
                        <span className="font-label-caps text-[10px] leading-tight text-on-surface-variant">
                          {tr[facility.labelKey]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="col-span-4 space-y-stack-lg">
              <section>
                <h2 className="font-title-md text-title-md text-primary mb-stack-md">
                  {tr.upcomingEvents}
                </h2>
                {events.length === 0 ? (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mosque-detail-glass glass-card p-4 rounded-xl">
                    {tr.noUpcomingEvents}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event, i) => (
                      <div
                        key={event.id}
                        className={cn(
                          'mosque-detail-glass glass-card p-4 rounded-xl border-l-4',
                          i % 2 === 0 ? 'border-secondary' : 'border-primary'
                        )}
                      >
                        <p
                          className={cn(
                            'font-label-caps text-label-caps mb-1',
                            i % 2 === 0 ? 'text-secondary' : 'text-primary'
                          )}
                        >
                          {formatEventWhen(event, lang)}
                        </p>
                        <h3 className="font-title-md text-title-md text-on-surface mb-1">
                          {getEventTitle(event, lang)}
                        </h3>
                        {event.description && (
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {event.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {lat != null && lng != null && (
                <section>
                  <h2 className="font-title-md text-title-md text-primary mb-stack-md">
                    {tr.location}
                  </h2>
                  <a
                    href={mapsUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mosque-detail-glass glass-card rounded-xl overflow-hidden h-48 relative block"
                  >
                    <Image
                      src={MOSQUE_MAP_PLACEHOLDER}
                      alt={tr.location}
                      fill
                      className="object-cover opacity-60"
                      unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span
                        className="material-symbols-outlined text-secondary text-5xl material-symbols-filled"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        location_pin
                      </span>
                    </div>
                  </a>
                </section>
              )}

              {(mosque.phone || mosque.website) && (
                <section className="mosque-detail-glass glass-card p-6 rounded-xl">
                  <h2 className="font-title-md text-title-md text-primary mb-4">{tr.contactInfo}</h2>
                  <div className="space-y-4">
                    {mosque.phone && (
                      <a
                        className="flex items-center gap-3 text-on-surface-variant hover:text-secondary transition-colors"
                        href={`tel:${mosque.phone}`}
                      >
                        <span className="material-symbols-outlined text-primary">call</span>
                        <span className="font-body-lg text-body-lg">{mosque.phone}</span>
                      </a>
                    )}
                    {mosque.website && (
                      <a
                        className="flex items-center gap-3 text-on-surface-variant hover:text-secondary transition-colors"
                        href={mosque.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined text-primary">language</span>
                        <span className="font-body-lg text-body-lg">
                          {mosque.website.replace(/^https?:\/\//, '')}
                        </span>
                      </a>
                    )}
                    <div className="flex gap-4 mt-6">
                      {mosque.phone && (
                        <a
                          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors"
                          href={`tel:${mosque.phone}`}
                        >
                          <span className="material-symbols-outlined">alternate_email</span>
                        </a>
                      )}
                      {mosque.website && (
                        <a
                          className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors"
                          href={mosque.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="material-symbols-outlined">chat</span>
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
