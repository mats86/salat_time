'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { formatScheduleDate } from '@/lib/i18n';
import { PrayerRow } from './PrayerRow';
import { Spinner } from '@/components/ui/Spinner';
import { isoDateToDate } from '@/lib/aladhan';
import type { DayPrayerSchedule } from '@/types';

interface PrayerGridProps {
  days: DayPrayerSchedule[];
  todayIndex: number;
  loading?: boolean;
}

export function PrayerGrid({ days, todayIndex, loading }: PrayerGridProps) {
  const { lang, tr } = useLang();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(todayIndex);
  const hasScrolledToToday = useRef(false);

  const selectedDay = days[selectedIndex] ?? days[todayIndex];

  const updateSelectedFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || days.length === 0) return;
    const slideWidth = el.clientWidth;
    if (slideWidth <= 0) return;
    const index = Math.round(el.scrollLeft / slideWidth);
    const clamped = Math.max(0, Math.min(index, days.length - 1));
    setSelectedIndex(clamped);
  }, [days.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || days.length === 0 || hasScrolledToToday.current) return;

    const scrollToToday = () => {
      const slideWidth = el.clientWidth;
      if (slideWidth <= 0) return;
      el.scrollTo({ left: slideWidth * todayIndex, behavior: 'instant' as ScrollBehavior });
      setSelectedIndex(todayIndex);
      hasScrolledToToday.current = true;
    };

    scrollToToday();
    const id = requestAnimationFrame(scrollToToday);
    return () => cancelAnimationFrame(id);
  }, [days.length, todayIndex]);

  useEffect(() => {
    hasScrolledToToday.current = false;
    setSelectedIndex(todayIndex);
  }, [days, todayIndex]);

  if (loading && days.length === 0) {
    return (
      <section className="space-y-stack-md">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant px-1">
          {tr.prayerSchedule}
        </h3>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </section>
    );
  }

  if (days.length === 0) return null;

  const dateLabel = selectedDay
    ? formatScheduleDate(lang, isoDateToDate(selectedDay.date))
    : '';

  const hijriLabel = selectedDay
    ? `${selectedDay.hijri.day} ${selectedDay.hijri.month} ${selectedDay.hijri.year} ${tr.hijriSuffix}`
    : '';

  return (
    <section className="space-y-stack-md">
      <div className="px-1 space-y-1">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant">
          {tr.prayerSchedule}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-title-md text-sm text-on-surface">{dateLabel}</p>
          {selectedDay?.isToday && (
            <span className="font-label-caps text-[10px] text-secondary bg-secondary/15 px-2 py-0.5 rounded-full border border-secondary/25">
              {tr.scheduleToday}
            </span>
          )}
        </div>
        <p className="font-body-sm text-xs text-on-surface-variant">{hijriLabel}</p>
      </div>

      <div
        ref={scrollRef}
        onScroll={updateSelectedFromScroll}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-margin-mobile px-margin-mobile gap-0"
      >
        {days.map((day) => (
          <div
            key={day.date}
            className="flex-shrink-0 w-full min-w-full snap-center space-y-2"
          >
            {day.schedule.map((p) => (
              <PrayerRow
                key={`${day.date}-${p.name}`}
                prayer={p}
                highlightState={day.isToday}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
