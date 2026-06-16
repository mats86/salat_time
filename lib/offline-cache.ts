import type { SchedulePrayerPayload } from '@/lib/prayer-alerts';
import type { AsrSchool, LatitudeAdjustment } from '@/lib/calc-settings';
import type { CalendarDayEntry } from '@/lib/aladhan';

import type { HijriDate, Mosque, PrayerTimings } from '@/types';

const CALENDAR_PREFIX = 'sz_prayer_calendar_';
const PRAYER_PREFIX = 'sz_prayer_times_';
const MOSQUES_PREFIX = 'sz_mosques_';
const SCHEDULE_KEY = 'sz_prayer_schedule';

export interface CachedPrayerTimes {
  timings: PrayerTimings;
  hijri: HijriDate;
  date: string;
  fetchedAt: string;
}

export interface CachedMosques {
  mosques: Mosque[];
  fetchedAt: string;
}

export interface CachedPrayerCalendar {
  days: CalendarDayEntry[];
  year: number;
  month: number;
  fetchedAt: string;
}

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isSameDayCache(dateStr: string): boolean {
  return dateStr === todayDateKey();
}

function prayerKey(
  lat: number,
  lng: number,
  date: string,
  method: number,
  school: AsrSchool,
  latitudeAdjust: LatitudeAdjustment
): string {
  return `${PRAYER_PREFIX}${coordKey(lat, lng)}_${method}_${school}_${latitudeAdjust}_${date}`;
}

function prayerPrefix(
  lat: number,
  lng: number,
  method: number,
  school: AsrSchool,
  latitudeAdjust: LatitudeAdjustment
): string {
  return `${PRAYER_PREFIX}${coordKey(lat, lng)}_${method}_${school}_${latitudeAdjust}_`;
}

function mosquesKey(lat: number, lng: number): string {
  return `${MOSQUES_PREFIX}${coordKey(lat, lng)}`;
}

function calendarKey(
  lat: number,
  lng: number,
  year: number,
  month: number,
  method: number,
  school: AsrSchool,
  latitudeAdjust: LatitudeAdjustment
): string {
  return `${CALENDAR_PREFIX}${coordKey(lat, lng)}_${method}_${school}_${latitudeAdjust}_${year}-${month}`;
}

export function cachePrayerCalendar(
  lat: number,
  lng: number,
  year: number,
  month: number,
  days: CalendarDayEntry[],
  method = 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night'
): void {
  if (typeof window === 'undefined') return;
  const entry: CachedPrayerCalendar = {
    days,
    year,
    month,
    fetchedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    calendarKey(lat, lng, year, month, method, school, latitudeAdjust),
    JSON.stringify(entry)
  );
}

export function getCachedPrayerCalendar(
  lat: number,
  lng: number,
  year: number,
  month: number,
  method = 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night'
): CachedPrayerCalendar | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(
    calendarKey(lat, lng, year, month, method, school, latitudeAdjust)
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedPrayerCalendar;
  } catch {
    return null;
  }
}

export function cachePrayerTimes(
  lat: number,
  lng: number,
  data: { timings: PrayerTimings; hijri: HijriDate },
  date = todayDateKey(),
  method = 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night'
): void {
  if (typeof window === 'undefined') return;
  const entry: CachedPrayerTimes = {
    timings: data.timings,
    hijri: data.hijri,
    date,
    fetchedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    prayerKey(lat, lng, date, method, school, latitudeAdjust),
    JSON.stringify(entry)
  );
}

export function getCachedPrayerTimes(
  lat: number,
  lng: number,
  date = todayDateKey(),
  method = 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night'
): CachedPrayerTimes | null {
  if (typeof window === 'undefined') return null;

  const exact = localStorage.getItem(
    prayerKey(lat, lng, date, method, school, latitudeAdjust)
  );
  if (exact) {
    try {
      return JSON.parse(exact) as CachedPrayerTimes;
    } catch {
      /* fall through */
    }
  }

  const prefix = prayerPrefix(lat, lng, method, school, latitudeAdjust);
  let latest: CachedPrayerTimes | null = null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(prefix)) continue;
    try {
      const entry = JSON.parse(localStorage.getItem(key)!) as CachedPrayerTimes;
      if (!latest || entry.fetchedAt > latest.fetchedAt) {
        latest = entry;
      }
    } catch {
      /* skip */
    }
  }

  return latest;
}

export function cacheMosques(lat: number, lng: number, mosques: Mosque[]): void {
  if (typeof window === 'undefined') return;
  const entry: CachedMosques = {
    mosques,
    fetchedAt: new Date().toISOString(),
  };
  localStorage.setItem(mosquesKey(lat, lng), JSON.stringify(entry));
}

export function getCachedMosques(lat: number, lng: number): CachedMosques | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(mosquesKey(lat, lng));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedMosques;
  } catch {
    return null;
  }
}

export function cacheSchedulePayload(payload: SchedulePrayerPayload): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(payload));
}

export function getCachedSchedulePayload(): SchedulePrayerPayload | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SCHEDULE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SchedulePrayerPayload;
  } catch {
    return null;
  }
}
