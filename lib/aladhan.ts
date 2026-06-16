import { format } from 'date-fns';
import {
  asrSchoolToApi,
  latitudeAdjustToApi,
  type AsrSchool,
  type LatitudeAdjustment,
} from '@/lib/calc-settings';
import type { HijriDate, PrayerTimings, PrayerName, MergedPrayerTime } from '@/types';

export const PRAYER_ORDER: PrayerName[] = [
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

export interface AladhanResponse {
  data: {
    timings: Record<string, string>;
    date: {
      hijri: {
        day: string;
        month: { en: string; number?: number };
        year: string;
      };
    };
  };
}

export interface AladhanCalendarDay {
  timings: Record<string, string>;
  date: {
    readable: string;
    gregorian: {
      date: string;
      day: string;
      month: { number: number; en: string };
      year: string;
    };
    hijri: {
      day: string;
      month: { number: number; en: string };
      year: string;
    };
  };
}

export interface CalendarDayEntry {
  date: string;
  timings: PrayerTimings;
  hijri: HijriDate;
}

function stripTime(v: string): string {
  return v.split(' ')[0] ?? v;
}

function parseTimings(raw: Record<string, string>): PrayerTimings {
  return {
    Fajr: stripTime(raw.Fajr),
    Sunrise: stripTime(raw.Sunrise),
    Dhuhr: stripTime(raw.Dhuhr),
    Asr: stripTime(raw.Asr),
    Maghrib: stripTime(raw.Maghrib),
    Isha: stripTime(raw.Isha),
  };
}

function parseHijri(
  hijri: AladhanCalendarDay['date']['hijri'] | AladhanResponse['data']['date']['hijri']
): HijriDate {
  const month = hijri.month as { en: string; ar?: string; number?: number };
  return {
    day: hijri.day,
    month: month.en,
    monthAr: month.ar,
    year: hijri.year,
    monthNumber: 'number' in month ? month.number : undefined,
  };
}

/** Convert Aladhan gregorian date "DD-MM-YYYY" to ISO "YYYY-MM-DD". */
export function gregorianToIsoDate(gregorianDate: string): string {
  const [day, month, year] = gregorianDate.split('-');
  return `${year}-${month}-${day}`;
}

export function isoDateToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  method = Number(process.env.NEXT_PUBLIC_ALADHAN_METHOD) || 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night',
  date: Date = new Date()
): Promise<{ timings: PrayerTimings; hijri: HijriDate }> {
  const dateStr = format(date, 'dd-MM-yyyy');
  const schoolParam = asrSchoolToApi(school);
  const adjustParam = latitudeAdjustToApi(latitudeAdjust);
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}&school=${schoolParam}&latitudeAdjustmentMethod=${adjustParam}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch prayer times');
  const json: AladhanResponse = await res.json();
  const timings = parseTimings(json.data.timings);
  const hijri = parseHijri(json.data.date.hijri);
  return { timings, hijri };
}

export async function fetchPrayerCalendar(
  year: number,
  month: number,
  lat: number,
  lng: number,
  method = Number(process.env.NEXT_PUBLIC_ALADHAN_METHOD) || 3,
  school: AsrSchool = 'standard',
  latitudeAdjust: LatitudeAdjustment = 'middle_of_night'
): Promise<CalendarDayEntry[]> {
  const schoolParam = asrSchoolToApi(school);
  const adjustParam = latitudeAdjustToApi(latitudeAdjust);
  const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${method}&school=${schoolParam}&latitudeAdjustmentMethod=${adjustParam}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch prayer calendar');
  const json: { data: AladhanCalendarDay[] } = await res.json();
  return json.data.map((day) => ({
    date: gregorianToIsoDate(day.date.gregorian.date),
    timings: parseTimings(day.timings),
    hijri: parseHijri(day.date.hijri),
  }));
}

export function buildDaySchedule(
  timings: PrayerTimings,
  options: {
    isToday: boolean;
    nextPrayer?: { name: PrayerName; time: string } | null;
    mounted?: boolean;
  }
): MergedPrayerTime[] {
  const { isToday, nextPrayer, mounted = true } = options;
  return PRAYER_ORDER.map((name) => {
    if (!isToday) {
      return {
        name,
        time: timings[name],
        isCustom: false,
        isCurrent: false,
        isPast: false,
      };
    }
    const isCurrent = nextPrayer?.name === name;
    let isPast = false;
    if (mounted) {
      const now = new Date();
      const [h, m] = timings[name].split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(h, m, 0, 0);
      isPast = prayerTime < now && !isCurrent;
    }
    return {
      name,
      time: timings[name],
      isCustom: false,
      isCurrent,
      isPast,
    };
  });
}

export function getDateRangeKeys(
  center: Date,
  daysBefore: number,
  daysAfter: number
): { dates: string[]; todayIndex: number; months: { year: number; month: number }[] } {
  const dates: string[] = [];
  const monthSet = new Set<string>();

  for (let offset = -daysBefore; offset <= daysAfter; offset++) {
    const d = new Date(center);
    d.setDate(center.getDate() + offset);
    const iso = format(d, 'yyyy-MM-dd');
    dates.push(iso);
    monthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  }

  const months = Array.from(monthSet).map((key) => {
    const [year, month] = key.split('-').map(Number);
    return { year, month };
  });

  return { dates, todayIndex: daysBefore, months };
}

export function getNextPrayer(timings: PrayerTimings): { name: PrayerName; time: string } {
  const now = new Date();
  for (const name of PRAYER_ORDER) {
    const [h, m] = timings[name].split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(h, m, 0, 0);
    if (prayerTime > now) return { name, time: timings[name] };
  }
  return { name: 'Fajr', time: timings.Fajr };
}

export function getCountdownSeconds(targetTime: string): number {
  const [h, m] = targetTime.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const now = new Date();
  let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
  if (diff < 0) diff += 24 * 60 * 60;
  return diff;
}

export function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function getMergedTime(
  mosqueTime: string | null | undefined,
  locationTime: string
): { time: string; isCustom: boolean } {
  return mosqueTime
    ? { time: mosqueTime.slice(0, 5), isCustom: true }
    : { time: locationTime, isCustom: false };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
