import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { PRAYER_ALERT_NAMES } from '@/lib/prayer-alerts';

const LOCATION_KEY = 'salat_location_v2';
const MASTER_KEY = 'sz_prayer_alerts_master';
const PRAYER_KEY_PREFIX = 'sz_prayer_alerts_';

interface SalatNotificationsPlugin {
  requestPermission(): Promise<{ granted: boolean }>;
  refresh(): Promise<void>;
}

const SalatNotifications = registerPlugin<SalatNotificationsPlugin>('SalatNotifications');

async function setPref(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

/** Sync web app settings to native SharedPreferences for the Android widget. */
export async function syncNativeSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (typeof window === 'undefined') return;

  const lang = localStorage.getItem('lang') ?? 'de';
  const method = localStorage.getItem('sz_calc_method') ?? '3';
  const school = localStorage.getItem('sz_calc_school') ?? 'standard';
  const latitudeAdjust =
    localStorage.getItem('sz_calc_latitude_adjust') ?? 'middle_of_night';
  const location =
    localStorage.getItem(LOCATION_KEY) ??
    sessionStorage.getItem(LOCATION_KEY) ??
    '';
  const masterEnabled = localStorage.getItem(MASTER_KEY) ?? 'false';

  const prayerPrefs = PRAYER_ALERT_NAMES.map((prayer) => {
    const key = `${PRAYER_KEY_PREFIX}${prayer}`;
    const value = localStorage.getItem(key) ?? 'true';
    return setPref(key, value);
  });

  await Promise.all([
    setPref('lang', lang),
    setPref('sz_calc_method', method),
    setPref('sz_calc_school', school),
    setPref('sz_calc_latitude_adjust', latitudeAdjust),
    setPref(MASTER_KEY, masterEnabled),
    ...prayerPrefs,
    location ? setPref(LOCATION_KEY, location) : Promise.resolve(),
  ]);
}

export async function syncNativeLocation(
  lat: number,
  lng: number,
  label?: string,
  source?: string,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const payload = JSON.stringify({
    lat,
    lng,
    label,
    source: source ?? 'manual',
  });

  localStorage.setItem(LOCATION_KEY, payload);
  await setPref(LOCATION_KEY, payload);
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const result = await SalatNotifications.requestPermission();
    return result.granted;
  } catch {
    return false;
  }
}

export async function refreshNativeNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SalatNotifications.refresh();
  } catch {
    /* ignored */
  }
}
