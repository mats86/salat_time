import type { PrayerName } from '@/types';

export type PrayerMethod = 'automatic' | 'manual';

export interface StaffPrayerRow {
  name: Exclude<PrayerName, 'Sunrise'>;
  icon: string;
  baseTime: string;
  method: PrayerMethod;
  offset: number;
  dimmed?: boolean;
}

export interface StaffFacility {
  key: string;
  label: string;
  checked: boolean;
  field?: keyof MosqueFacilityFields;
}

export interface MosqueFacilityFields {
  has_women_area: boolean;
  has_parking: boolean;
  has_wudu: boolean;
  has_wheelchair: boolean;
}

export interface StaffEventItem {
  id: string;
  month: string;
  day: string;
  title: string;
  time: string;
  accent: 'primary' | 'tertiary';
}

export const DEFAULT_PRAYER_ROWS: StaffPrayerRow[] = [
  { name: 'Fajr', icon: 'wb_twilight', baseTime: '04:17', method: 'manual', offset: 15 },
  { name: 'Dhuhr', icon: 'wb_sunny', baseTime: '13:15', method: 'automatic', offset: 0 },
  { name: 'Asr', icon: 'flare', baseTime: '17:04', method: 'automatic', offset: 0, dimmed: true },
  { name: 'Maghrib', icon: 'nights_stay', baseTime: '20:45', method: 'automatic', offset: 0 },
  { name: 'Isha', icon: 'bedtime', baseTime: '21:52', method: 'manual', offset: 20 },
];

export const DEFAULT_FACILITIES: StaffFacility[] = [
  { key: 'women', label: "Women's Prayer Area", checked: true, field: 'has_women_area' },
  { key: 'parking', label: 'Parking Available', checked: true, field: 'has_parking' },
  { key: 'wudu', label: 'Wudu Facilities', checked: true, field: 'has_wudu' },
  { key: 'wheelchair', label: 'Wheelchair Access', checked: false, field: 'has_wheelchair' },
  { key: 'nikah', label: 'Nikah Services', checked: false },
];

export interface MobileStaffPrayerRow {
  name: Exclude<PrayerName, 'Sunrise'>;
  icon: string;
  baseTime: string;
  method: PrayerMethod;
  offset: number;
  highlighted?: boolean;
  iconFilled?: boolean;
}

export const MOBILE_PRAYER_ROWS: MobileStaffPrayerRow[] = [
  { name: 'Fajr', icon: 'wb_twilight', baseTime: '05:12', method: 'automatic', offset: 0 },
  { name: 'Dhuhr', icon: 'light_mode', baseTime: '13:04', method: 'automatic', offset: -2 },
  { name: 'Asr', icon: 'wb_sunny', baseTime: '16:45', method: 'automatic', offset: 5 },
  { name: 'Maghrib', icon: 'dark_mode', baseTime: '20:21', method: 'manual', offset: 5, highlighted: true, iconFilled: true },
  { name: 'Isha', icon: 'nights_stay', baseTime: '21:58', method: 'automatic', offset: 0 },
];

export const MOBILE_FACILITIES: StaffFacility[] = [
  { key: 'women', label: "Women's Prayer Area", checked: true, field: 'has_women_area' },
  { key: 'parking', label: 'Parking', checked: true, field: 'has_parking' },
  { key: 'wudu', label: 'Wudu Facilities', checked: true, field: 'has_wudu' },
  { key: 'library', label: 'Library', checked: false },
];

export const MOBILE_EVENTS: StaffEventItem[] = [
  {
    id: 'm1',
    month: 'JUL',
    day: '18',
    title: 'Weekly Youth Circle',
    time: '19:00 - 20:30',
    accent: 'primary',
  },
  {
    id: 'm2',
    month: 'JUL',
    day: '21',
    title: "Sisters' Tajweed",
    time: '11:00 - 12:30',
    accent: 'primary',
  },
];

export function formatOffsetLabel(offset: number): string {
  if (offset > 0) return `+${offset}`;
  if (offset < 0) return `${offset}`;
  return '+0';
}

export const DEFAULT_EVENTS: StaffEventItem[] = [
  {
    id: '1',
    month: 'JUN',
    day: '15',
    title: 'Weekly Youth Circle',
    time: '18:30 - 20:00',
    accent: 'primary',
  },
  {
    id: '2',
    month: 'JUN',
    day: '22',
    title: "Qur'an Tajweed Class",
    time: '17:00 - 18:30',
    accent: 'tertiary',
  },
];

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
}

export function applyOffset(baseTime: string, offsetMin: number): string {
  const [h, m] = baseTime.split(':').map(Number);
  const total = h * 60 + m + offsetMin;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(normalized / 60);
  const nm = normalized % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

export function getActivePrayerName(): Exclude<PrayerName, 'Sunrise'> {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const order: { name: Exclude<PrayerName, 'Sunrise'>; time: string }[] = [
    { name: 'Fajr', time: '04:17' },
    { name: 'Dhuhr', time: '13:15' },
    { name: 'Asr', time: '17:04' },
    { name: 'Maghrib', time: '20:45' },
    { name: 'Isha', time: '21:52' },
  ];

  for (const prayer of order) {
    const [h, m] = prayer.time.split(':').map(Number);
    if (h * 60 + m > minutes) return prayer.name;
  }
  return 'Fajr';
}
