import { isPwaInstalled } from '@/lib/biometric';
import { getPrayerLabel, type Lang } from '@/lib/i18n';
import type { PrayerTimings } from '@/types';

export type PrayerAlertName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export const PRAYER_ALERT_NAMES: PrayerAlertName[] = [
  'Fajr',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
];

const MASTER_KEY = 'sz_prayer_alerts_master';
const PRAYER_KEY_PREFIX = 'sz_prayer_alerts_';
const FIRED_KEY_PREFIX = 'sz_prayer_alerts_fired_';
const AUDIO_UNLOCKED_KEY = 'sz_prayer_alerts_audio_unlocked';

export const ADHAN_AUDIO_PATH = '/sounds/adhan.mp3';

export interface PrayerAlertSettings {
  masterEnabled: boolean;
  prayers: Record<PrayerAlertName, boolean>;
}

export interface SchedulePrayerPayload {
  prayers: Array<{ name: PrayerAlertName; time: string; enabled: boolean }>;
  lang: Lang;
  labels: Record<PrayerAlertName, { title: string; body: string }>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function firedKey(prayer: PrayerAlertName): string {
  return `${FIRED_KEY_PREFIX}${prayer}_${todayKey()}`;
}

function prayerStorageKey(prayer: PrayerAlertName): string {
  return `${PRAYER_KEY_PREFIX}${prayer}`;
}

function readPrayerEnabled(prayer: PrayerAlertName): boolean {
  const stored = localStorage.getItem(prayerStorageKey(prayer));
  if (stored === null) return true;
  return stored === 'true';
}

export function getPrayerAlertSettings(): PrayerAlertSettings {
  if (typeof window === 'undefined') {
    return {
      masterEnabled: false,
      prayers: Object.fromEntries(PRAYER_ALERT_NAMES.map((p) => [p, false])) as Record<
        PrayerAlertName,
        boolean
      >,
    };
  }

  const masterEnabled = localStorage.getItem(MASTER_KEY) === 'true';
  const prayers = Object.fromEntries(
    PRAYER_ALERT_NAMES.map((prayer) => [prayer, readPrayerEnabled(prayer)])
  ) as Record<PrayerAlertName, boolean>;

  return { masterEnabled, prayers };
}

export function isPrayerAlertActive(prayer: PrayerAlertName): boolean {
  const { masterEnabled, prayers } = getPrayerAlertSettings();
  return masterEnabled && prayers[prayer];
}

export function hasAnyPrayerAlertEnabled(): boolean {
  const { masterEnabled, prayers } = getPrayerAlertSettings();
  return masterEnabled && PRAYER_ALERT_NAMES.some((prayer) => prayers[prayer]);
}

function dispatchSettingsChanged(): void {
  window.dispatchEvent(new Event('prayer-alerts-changed'));
}

export function setMasterEnabled(enabled: boolean): void {
  localStorage.setItem(MASTER_KEY, String(enabled));
  dispatchSettingsChanged();
}

export function setPrayerAlertEnabled(prayer: PrayerAlertName, enabled: boolean): void {
  localStorage.setItem(prayerStorageKey(prayer), String(enabled));
  if (enabled) {
    localStorage.setItem(MASTER_KEY, 'true');
  } else {
    const anyEnabled = PRAYER_ALERT_NAMES.some(
      (name) => name !== prayer && readPrayerEnabled(name)
    );
    if (!anyEnabled) {
      localStorage.setItem(MASTER_KEY, 'false');
    }
  }
  dispatchSettingsChanged();
}

export function canUsePrayerAlerts(): boolean {
  if (typeof window === 'undefined') return false;
  return isPwaInstalled() && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function wasPrayerFiredToday(prayer: PrayerAlertName): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(firedKey(prayer)) === 'true';
}

export function markPrayerFired(prayer: PrayerAlertName): void {
  localStorage.setItem(firedKey(prayer), 'true');
}

export function getMsUntilPrayer(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  let diff = target.getTime() - Date.now();
  if (diff < 0) diff += 24 * 60 * 60 * 1000;
  return diff;
}

export function isPrayerTimeNow(time: string): boolean {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  return now.getHours() === h && now.getMinutes() === m;
}

export function buildSchedulePayload(
  timings: PrayerTimings,
  lang: Lang
): SchedulePrayerPayload {
  const settings = getPrayerAlertSettings();
  const notificationBody =
    lang === 'de'
      ? 'Es ist Zeit für das Gebet.'
      : lang === 'ar'
        ? 'حان وقت الصلاة.'
        : 'It is time for prayer.';

  const labels = Object.fromEntries(
    PRAYER_ALERT_NAMES.map((prayer) => [
      prayer,
      {
        title:
          lang === 'de'
            ? `Zeit für ${getPrayerLabel(lang, prayer)}`
            : lang === 'ar'
              ? `حان وقت ${getPrayerLabel(lang, prayer)}`
              : `Time for ${getPrayerLabel(lang, prayer)}`,
        body: notificationBody,
      },
    ])
  ) as Record<PrayerAlertName, { title: string; body: string }>;

  return {
    lang,
    labels,
    prayers: PRAYER_ALERT_NAMES.map((name) => ({
      name,
      time: timings[name],
      enabled: settings.masterEnabled && settings.prayers[name],
    })),
  };
}

export async function postScheduleToServiceWorker(
  timings: PrayerTimings,
  lang: Lang
): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const worker = registration.active ?? navigator.serviceWorker.controller;
  if (!worker) return;

  worker.postMessage({
    type: 'SCHEDULE_PRAYERS',
    payload: buildSchedulePayload(timings, lang),
  });
}

let adhanAudio: HTMLAudioElement | null = null;

function getAdhanAudio(): HTMLAudioElement {
  if (!adhanAudio) {
    adhanAudio = new Audio(ADHAN_AUDIO_PATH);
    adhanAudio.preload = 'auto';
  }
  return adhanAudio;
}

export async function unlockAdhanAudio(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(AUDIO_UNLOCKED_KEY) === 'true') return;

  const audio = getAdhanAudio();
  try {
    audio.volume = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
    localStorage.setItem(AUDIO_UNLOCKED_KEY, 'true');
  } catch {
    /* autoplay policy — will retry on next gesture */
  }
}

export async function playAdhan(): Promise<void> {
  const audio = getAdhanAudio();
  audio.currentTime = 0;
  try {
    await audio.play();
  } catch {
    /* ignored */
  }
}
