'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useLang } from '@/components/providers/LangProvider';
import {
  getAppBrandName,
  getPrayerLabel,
  formatCalendarTableDate,
  formatCalendarTableHijriDate,
  formatCalendarMonthYear,
  getCalcSettingsSummary,
  isRamadanMonth,
} from '@/lib/i18n';
import { usePrayerCalendarMonth } from '@/hooks/usePrayerCalendarMonth';
import { isoDateToDate } from '@/lib/aladhan';
import { Spinner } from '@/components/ui/Spinner';
import { formatTime12 } from '@/lib/utils';
import type { CalendarDayEntry } from '@/lib/aladhan';
import type { Lang, PrayerName } from '@/types';

const PROFILE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDy-Ty9zypm6IdZKgubRDHpVRsFv8EVUp90a9EV-TBxFDeKOqZhrekcWZugqgOJb7s5Qcl7q-lq6rjuzgZ7u8_76HhM36-hjnV-m3l6wvOR2fexjP03x1EQ5Iue4luqXvVHzDQRfGZL1Pnj5PRM7H6wutkPh2otC7kObH0HIJ_f8N9tVkgW_qwQfHi1wO7-WoSkN6pMcpYXvprhurPbnuFUKgaJyZ46ab0qDjsd5y1OdoUHrNMTFo8ySUVbyNfLDE6-AkwDKxi-K429';

const TABLE_PRAYERS: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface CalendarDesktopProps {
  lat: number;
  lng: number;
  locationLabel?: string;
}

type TableRow =
  | { type: 'day'; day: CalendarDayEntry; isToday: boolean }
  | { type: 'ramadan'; hijriYear: string; expectedDate: string };

function buildTableRows(days: CalendarDayEntry[], today: string): TableRow[] {
  const rows: TableRow[] = [];
  let prevRamadan = false;

  for (const day of days) {
    const ramadan = isRamadanMonth(day.hijri);
    if (ramadan && !prevRamadan) {
      rows.push({
        type: 'ramadan',
        hijriYear: day.hijri.year,
        expectedDate: format(isoDateToDate(day.date), 'MMM dd'),
      });
    }
    prevRamadan = ramadan;
    rows.push({ type: 'day', day, isToday: day.date === today });
  }

  return rows;
}

export function CalendarDesktop({ lat, lng, locationLabel }: CalendarDesktopProps) {
  const { lang, tr } = useLang();
  const brandName = getAppBrandName(lang);
  const {
    days,
    loading,
    year,
    month,
    goToPreviousMonth,
    goToNextMonth,
    today,
  } = usePrayerCalendarMonth(lat, lng);

  const gregorianTitle = formatCalendarMonthYear(lang, year, month);
  const hijriTitle = days[0]
    ? `${days[0].hijri.month} ${days[0].hijri.year}`
  : '';
  const headerTitle = tr.calendarMonthlyTitle
    .replace('{gregorian}', gregorianTitle)
    .replace('{hijri}', hijriTitle);

  const subtitle = tr.calendarMonthlySubtitle.replace(
    '{location}',
    locationLabel ?? '—'
  );

  const tableRows = buildTableRows(days, today);
  const calcFooter = getCalcSettingsSummary(lang);
  const locationName = locationLabel ?? '—';

  return (
    <div className="hidden md:flex flex-col min-h-screen bg-background text-on-background font-body-lg selection:bg-secondary/30">
      <nav className="fixed top-0 w-full z-50 bg-surface-container-low/40 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-center w-full px-margin-desktop py-4 max-w-screen-xl mx-auto">
          <Link href="/" className="font-headline-lg text-headline-lg text-primary tracking-tight">
            {brandName}
          </Link>
          <div className="hidden md:flex items-center gap-stack-lg">
            <Link
              href="/"
              className="text-primary font-bold border-b-2 border-primary py-1 font-label-caps text-label-caps"
            >
              {tr.navPrayerTimes}
            </Link>
            <Link
              href="/#mosques"
              className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-caps text-label-caps"
            >
              {tr.mosques}
            </Link>
            <Link
              href="/qibla"
              className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-caps text-label-caps"
            >
              {tr.qibla}
            </Link>
            <Link
              href="/auth/login"
              className="text-on-surface-variant hover:text-primary transition-colors duration-200 font-label-caps text-label-caps"
            >
              {tr.navCommunity}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="p-2 rounded-full hover:bg-surface-container-highest transition-colors active:opacity-80 active:scale-95"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-primary">notifications</span>
            </button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant">
              <Image
                src={PROFILE_IMAGE}
                alt=""
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-margin-desktop max-w-screen-xl mx-auto min-h-screen w-full flex-grow">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
                aria-label="Previous month"
              >
                <span className="material-symbols-outlined text-secondary">chevron_left</span>
              </button>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{headerTitle}</h1>
              <button
                type="button"
                onClick={goToNextMonth}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container transition-colors"
                aria-label="Next month"
              >
                <span className="material-symbols-outlined text-secondary">chevron_right</span>
              </button>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">{subtitle}</p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-label-caps text-label-caps"
            >
              <span className="material-symbols-outlined">event</span>
              {tr.addToCalendar}
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-secondary text-on-secondary hover:opacity-90 transition-opacity font-label-caps text-label-caps"
            >
              <span className="material-symbols-outlined">picture_as_pdf</span>
              {tr.exportToPdf}
            </button>
          </div>
        </header>

        <div className="glass-card rounded-xl border border-outline-variant overflow-hidden shadow-2xl">
          {loading ? (
            <div className="flex justify-center py-24">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-x-auto table-scrollbar">
              <table className="w-full text-left border-collapse min-w-[860px]">
                <thead className="bg-surface-container-high border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-5 font-label-caps text-label-caps text-secondary">
                      {tr.calendarDateColumn}
                    </th>
                    <th className="px-6 py-5 font-label-caps text-label-caps text-secondary">
                      {tr.calendarHijriColumn}
                    </th>
                    {TABLE_PRAYERS.map((name) => (
                      <th
                        key={name}
                        className="px-6 py-5 font-label-caps text-label-caps text-on-surface-variant"
                      >
                        {getPrayerLabel(lang, name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-body-lg text-body-lg">
                  {tableRows.map((row) => {
                    if (row.type === 'ramadan') {
                      return (
                        <tr
                          key={`ramadan-${row.expectedDate}`}
                          className="bg-tertiary-container/20 border-b border-tertiary/20"
                        >
                          <td
                            colSpan={8}
                            className="px-6 py-3 text-center font-label-caps text-label-caps text-tertiary tracking-widest"
                          >
                            {tr.ramadanBeginsBanner
                              .replace('{year}', row.hijriYear)
                              .replace('{date}', row.expectedDate.toUpperCase())}
                          </td>
                        </tr>
                      );
                    }

                    const { day, isToday } = row;
                    const rowClass = isToday
                      ? 'active-day-glow bg-secondary/5 calendar-row-active'
                      : 'border-b border-outline-variant/30 hover:bg-white/5 calendar-row-hover';

                    return (
                      <tr key={day.date} className={rowClass}>
                        <td
                          className={`px-6 py-4 ${isToday ? 'font-bold text-secondary' : 'font-semibold text-primary'}`}
                        >
                          {isToday ? (
                            <div className="flex items-center gap-2">
                              {formatCalendarTableDate(lang, day.date)}
                              <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.5 rounded-full uppercase">
                                {tr.scheduleToday}
                              </span>
                            </div>
                          ) : (
                            formatCalendarTableDate(lang, day.date)
                          )}
                        </td>
                        <td
                          className={`px-6 py-4 font-arabic ${isToday ? 'font-bold text-secondary' : 'text-on-surface-variant'}`}
                          dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        >
                          {formatCalendarTableHijriDate(lang, day.hijri)}
                        </td>
                        {TABLE_PRAYERS.map((name) => (
                          <td
                            key={name}
                            className={`px-6 py-4 ${isToday && name === 'Fajr' ? 'font-bold text-on-surface' : ''}`}
                          >
                            {formatTime12(day.timings[name])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {tr.legendCurrentDay}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {tr.legendSpecialOccasions}
                </span>
              </div>
            </div>
            <div className="font-body-sm text-body-sm text-on-surface-variant italic">{calcFooter}</div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-secondary mb-4">location_on</span>
            <h3 className="font-title-md text-title-md mb-2">{tr.calendarLocationTitle}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {tr.calendarLocationDesc.replace('{location}', locationName)}
            </p>
          </div>
          <Link
            href="/settings"
            className="glass-card p-6 rounded-xl border border-outline-variant hover:border-secondary transition-colors block"
          >
            <span className="material-symbols-outlined text-tertiary mb-4">settings</span>
            <h3 className="font-title-md text-title-md mb-2">{tr.calendarSettingsTitle}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.calendarSettingsDesc}</p>
          </Link>
          <div className="glass-card p-6 rounded-xl border border-outline-variant">
            <span className="material-symbols-outlined text-primary mb-4">notifications_active</span>
            <h3 className="font-title-md text-title-md mb-2">{tr.calendarRemindersTitle}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.calendarRemindersDesc}</p>
          </div>
        </div>
      </main>

      <footer className="w-full px-margin-desktop py-stack-lg flex flex-col md:flex-row justify-between items-center gap-stack-md bg-surface-container-lowest border-t border-outline-variant mt-auto">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="font-headline-lg text-headline-lg text-on-surface">{brandName}</div>
          <p className="font-body-sm text-body-sm text-secondary">{tr.calendarFooterTagline}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="#"
            className="text-on-surface-variant hover:text-secondary transition-colors font-label-caps text-label-caps"
          >
            {tr.privacyPolicy}
          </a>
          <a
            href="#"
            className="text-on-surface-variant hover:text-secondary transition-colors font-label-caps text-label-caps"
          >
            {tr.termsOfService}
          </a>
          <a
            href="mailto:support@salatzeit.de"
            className="text-on-surface-variant hover:text-secondary transition-colors font-label-caps text-label-caps"
          >
            {tr.contactUs}
          </a>
          <a
            href="#"
            className="text-on-surface-variant hover:text-secondary transition-colors font-label-caps text-label-caps"
          >
            {tr.aboutUs}
          </a>
        </div>
      </footer>
    </div>
  );
}
