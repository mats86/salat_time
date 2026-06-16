'use client';

import Link from 'next/link';
import { useLang } from '@/components/providers/LangProvider';
import {
  formatCalendarMobileRowDate,
  formatCalendarMonthYear,
  getCalendarHijriSubtitle,
  getCalcMethodLabel,
  getAsrSchoolLabel,
} from '@/lib/i18n';
import { usePrayerCalendarMonth } from '@/hooks/usePrayerCalendarMonth';
import { useCalcSettings } from '@/hooks/useCalcSettings';
import { Spinner } from '@/components/ui/Spinner';
import type { PrayerName } from '@/types';

const TABLE_PRAYERS: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

interface CalendarMobileProps {
  lat: number;
  lng: number;
  locationLabel?: string;
}

function getDayState(dateIso: string, today: string): 'past' | 'today' | 'future' {
  if (dateIso === today) return 'today';
  if (dateIso < today) return 'past';
  return 'future';
}

export function CalendarMobile({ lat, lng, locationLabel }: CalendarMobileProps) {
  const { lang, tr } = useLang();
  const { settings } = useCalcSettings();
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
  const hijriSubtitle = getCalendarHijriSubtitle(lang, days, tr.hijriSuffix);
  const methodLabel = getCalcMethodLabel(lang, settings.method);
  const asrLabel = getAsrSchoolLabel(lang, settings.school);
  const locationName = locationLabel ?? '—';
  const regionName = locationName.split(',')[0]?.trim() || locationName;

  const columnHeaders = [
    tr.calendarColDate,
    tr.calendarColFajr,
    tr.calendarColSun,
    tr.calendarColDhuhr,
    tr.calendarColAsr,
    tr.calendarColMagh,
    tr.calendarColIsha,
  ];

  return (
    <main className="pt-24 pb-32 px-margin-mobile min-h-screen">
      <section className="mb-stack-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="p-2 glass-card rounded-full text-secondary active:scale-90 transition-transform"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="text-center">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {gregorianTitle}
            </h2>
            {hijriSubtitle && (
              <p className="font-label-caps text-label-caps text-secondary uppercase tracking-widest mt-1">
                {hijriSubtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 glass-card rounded-full text-secondary active:scale-90 transition-transform"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="flex gap-stack-sm overflow-x-auto hide-scrollbar py-2">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-secondary-container text-on-secondary-container rounded-full font-label-caps text-[11px] whitespace-nowrap active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
            {tr.addToCalendar}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 glass-card border border-outline-variant text-on-surface rounded-full font-label-caps text-[11px] whitespace-nowrap active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            {tr.exportToPdf}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 glass-card border border-outline-variant text-on-surface rounded-full font-label-caps text-[11px] whitespace-nowrap active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">share</span>
            {tr.shareSchedule}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 px-4 mb-2 text-center opacity-60">
            {columnHeaders.map((label) => (
              <div key={label} className="font-label-caps text-[9px]">
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {days.map((day) => {
              const state = getDayState(day.date, today);
              const isToday = state === 'today';
              const isPast = state === 'past';

              if (isToday) {
                return (
                  <div
                    key={day.date}
                    className="grid grid-cols-7 gap-1 p-3 glass-card rounded-xl text-center items-center active-day-glow relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-transparent pointer-events-none" />
                    <div className="font-label-caps text-[11px] text-secondary font-bold relative z-10">
                      {formatCalendarMobileRowDate(lang, day.date)}
                    </div>
                    {TABLE_PRAYERS.map((name) => (
                      <div
                        key={name}
                        className="font-body-sm text-[12px] font-semibold text-on-surface relative z-10"
                      >
                        {day.timings[name]}
                      </div>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  key={day.date}
                  className={`grid grid-cols-7 gap-1 p-3 glass-card rounded-xl text-center items-center transition-colors ${
                    isPast
                      ? 'opacity-40'
                      : 'hover:bg-surface-variant/20'
                  }`}
                >
                  <div
                    className={`font-label-caps text-[10px] ${
                      isPast ? '' : 'text-on-surface-variant'
                    }`}
                  >
                    {formatCalendarMobileRowDate(lang, day.date)}
                  </div>
                  {TABLE_PRAYERS.map((name) => (
                    <div key={name} className="font-body-sm text-[11px]">
                      {day.timings[name]}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      <section className="mt-stack-lg space-y-stack-sm">
        <div className="p-4 glass-card rounded-xl border border-outline-variant/30">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
            <div>
              <h4 className="font-label-caps text-[11px] text-primary">
                {tr.calendarLocationDetected}
              </h4>
              <p className="font-body-sm text-[13px] text-on-surface mt-0.5">{locationName}</p>
            </div>
          </div>
        </div>

        <Link
          href="/settings"
          className="block p-4 glass-card rounded-xl border border-outline-variant/30 hover:border-secondary/40 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-lg">
              settings_input_component
            </span>
            <div>
              <h4 className="font-label-caps text-[11px] text-primary">
                {tr.calendarCalculationMethod}
              </h4>
              <p className="font-body-sm text-[13px] text-on-surface mt-0.5">{methodLabel}</p>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-1 italic">
                {tr.calendarAsrApplied.replace('{asr}', asrLabel)}
              </p>
            </div>
          </div>
        </Link>

        <div className="py-stack-md text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant leading-relaxed whitespace-pre-line">
            {tr.calendarDisclaimer.replace('{region}', regionName)}
          </p>
        </div>
      </section>
    </main>
  );
}
