export type Lang = 'de' | 'ar' | 'en';

export type PrayerName =
  | 'Fajr'
  | 'Sunrise'
  | 'Dhuhr'
  | 'Asr'
  | 'Maghrib'
  | 'Isha';

export interface PrayerTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface HijriDate {
  day: string;
  month: string;
  year: string;
}

export interface Mosque {
  id: string;
  status: string;
  name: string;
  name_ar?: string | null;
  name_en?: string | null;
  city?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: string | null;
  has_women_area?: boolean;
  has_parking?: boolean;
  has_wudu?: boolean;
  has_wheelchair?: boolean;
  phone?: string | null;
  website?: string | null;
  image?: string | null;
  distance_km?: number;
  prayer_times?: MosquePrayerTimes | null;
}

export interface MosquePrayerTimes {
  id: string;
  mosque_id: string;
  status: string;
  fajr?: string | null;
  sunrise?: string | null;
  dhuhr?: string | null;
  asr?: string | null;
  maghrib?: string | null;
  isha?: string | null;
  juma?: string | null;
}

export interface MosqueEvent {
  id: string;
  mosque_id: string;
  status: string;
  title?: string | null;
  title_ar?: string | null;
  title_en?: string | null;
  description?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  is_recurring?: boolean;
  recurrence?: string | null;
}

export interface ChangeRequest {
  id: string;
  mosque_id?: string | null;
  submitted_by?: string | null;
  type: 'prayer_times' | 'event' | 'mosque_info' | 'new_mosque';
  status: 'pending' | 'approved' | 'rejected';
  payload?: Record<string, unknown> | null;
  admin_note?: string | null;
  reviewed_by?: string | null;
  date_created?: string | null;
  date_reviewed?: string | null;
}

export interface MosqueStaff {
  id: number;
  user_id: string;
  mosque_id: string;
  role: 'staff' | 'imam' | 'manager';
}

export interface DirectusUser {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: { id: string; name: string; admin_access?: boolean };
}

export interface MagicLoginLink {
  id: string;
  user: string | DirectusUser;
  email: string;
  token_hash?: string;
  expires_at: string;
  used_at?: string | null;
  date_created?: string;
}

export interface MergedPrayerTime {
  name: PrayerName;
  time: string;
  isCustom: boolean;
  isCurrent: boolean;
  isPast: boolean;
}
