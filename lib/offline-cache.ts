import type { SchedulePrayerPayload } from '@/lib/prayer-alerts';
import type { HijriDate, Mosque, PrayerTimings } from '@/types';

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

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export function todayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isSameDayCache(dateStr: string): boolean {
  return dateStr === todayDateKey();
}

function prayerKey(lat: number, lng: number, date: string): string {
  return `${PRAYER_PREFIX}${coordKey(lat, lng)}_${date}`;
}

function mosquesKey(lat: number, lng: number): string {
  return `${MOSQUES_PREFIX}${coordKey(lat, lng)}`;
}

export function cachePrayerTimes(
  lat: number,
  lng: number,
  data: { timings: PrayerTimings; hijri: HijriDate },
  date = todayDateKey()
): void {
  if (typeof window === 'undefined') return;
  const entry: CachedPrayerTimes = {
    timings: data.timings,
    hijri: data.hijri,
    date,
    fetchedAt: new Date().toISOString(),
  };
  localStorage.setItem(prayerKey(lat, lng, date), JSON.stringify(entry));
}

export function getCachedPrayerTimes(
  lat: number,
  lng: number,
  date = todayDateKey()
): CachedPrayerTimes | null {
  if (typeof window === 'undefined') return null;

  const exact = localStorage.getItem(prayerKey(lat, lng, date));
  if (exact) {
    try {
      return JSON.parse(exact) as CachedPrayerTimes;
    } catch {
      /* fall through */
    }
  }

  const prefix = `${PRAYER_PREFIX}${coordKey(lat, lng)}_`;
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
