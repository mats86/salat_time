import { format } from 'date-fns';
import type { HijriDate, PrayerTimings, PrayerName } from '@/types';

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
        month: { en: string };
        year: string;
      };
    };
  };
}

export async function fetchPrayerTimes(
  lat: number,
  lng: number,
  method = Number(process.env.NEXT_PUBLIC_ALADHAN_METHOD) || 3
): Promise<{ timings: PrayerTimings; hijri: HijriDate }> {
  const dateStr = format(new Date(), 'dd-MM-yyyy');
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch prayer times');
  const json: AladhanResponse = await res.json();
  const raw = json.data.timings;
  const strip = (v: string) => v.split(' ')[0] ?? v;
  const timings: PrayerTimings = {
    Fajr: strip(raw.Fajr),
    Sunrise: strip(raw.Sunrise),
    Dhuhr: strip(raw.Dhuhr),
    Asr: strip(raw.Asr),
    Maghrib: strip(raw.Maghrib),
    Isha: strip(raw.Isha),
  };
  const hijri: HijriDate = {
    day: json.data.date.hijri.day,
    month: json.data.date.hijri.month.en,
    year: json.data.date.hijri.year,
  };
  return { timings, hijri };
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
