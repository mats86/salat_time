import type { Mosque } from '@/types';

export type MosqueDisplayStatus = 'active' | 'pending' | 'offline';

export interface MosqueTableRow {
  id: string;
  name: string;
  location: string;
  status: MosqueDisplayStatus;
  staffCount: number;
  syncStatus: 'auto' | 'manual' | 'failed';
  icon: string;
  iconClass: string;
  highlighted?: boolean;
  dimmed?: boolean;
}

const ROW_ICONS = ['mosque', 'church', 'temple_hindu', 'block'] as const;

const DEMO_ROWS: MosqueTableRow[] = [
  {
    id: 'demo-1',
    name: 'Al-Noor Islamic Center',
    location: 'Berlin, Germany',
    status: 'active',
    staffCount: 12,
    syncStatus: 'auto',
    icon: 'mosque',
    iconClass: 'text-primary',
  },
  {
    id: 'demo-2',
    name: 'Munich Central Masjid',
    location: 'Munich, Germany',
    status: 'pending',
    staffCount: 5,
    syncStatus: 'manual',
    icon: 'church',
    iconClass: 'text-secondary',
    highlighted: true,
  },
  {
    id: 'demo-3',
    name: 'Grand Paris Mosque',
    location: 'Paris, France',
    status: 'active',
    staffCount: 24,
    syncStatus: 'auto',
    icon: 'temple_hindu',
    iconClass: 'text-primary',
  },
  {
    id: 'demo-4',
    name: 'Hamburg Heritage Center',
    location: 'Hamburg, Germany',
    status: 'offline',
    staffCount: 2,
    syncStatus: 'failed',
    icon: 'block',
    iconClass: 'text-on-surface-variant opacity-30',
    dimmed: true,
  },
];

export function mapMosqueStatus(status: string): MosqueDisplayStatus {
  if (status === 'published') return 'active';
  if (status === 'draft') return 'pending';
  return 'offline';
}

export function mapSyncStatus(status: MosqueDisplayStatus): MosqueTableRow['syncStatus'] {
  if (status === 'active') return 'auto';
  if (status === 'pending') return 'manual';
  return 'failed';
}

export function mosqueToTableRow(
  mosque: Mosque,
  staffCount: number,
  index: number
): MosqueTableRow {
  const displayStatus = mapMosqueStatus(mosque.status);
  const icon = ROW_ICONS[index % ROW_ICONS.length];
  return {
    id: mosque.id,
    name: mosque.name,
    location: mosque.city ? `${mosque.city}, Germany` : '—',
    status: displayStatus,
    staffCount,
    syncStatus: mapSyncStatus(displayStatus),
    icon: icon === 'block' && displayStatus !== 'offline' ? 'mosque' : icon,
    iconClass:
      displayStatus === 'pending'
        ? 'text-secondary'
        : displayStatus === 'offline'
          ? 'text-on-surface-variant opacity-30'
          : 'text-primary',
    highlighted: displayStatus === 'pending',
    dimmed: displayStatus === 'offline',
  };
}

export function buildMosqueRows(
  mosques: Mosque[],
  staffByMosque: Record<string, number>
): MosqueTableRow[] {
  if (mosques.length === 0) return DEMO_ROWS;
  return mosques.map((m, i) => mosqueToTableRow(m, staffByMosque[m.id] ?? 0, i));
}

export const STATUS_BADGE: Record<
  MosqueDisplayStatus,
  { label: string; className: string; pulse?: boolean; icon?: string }
> = {
  active: {
    label: 'Active',
    className:
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/30 text-tertiary text-body-sm font-semibold',
    pulse: true,
  },
  pending: {
    label: 'Pending Review',
    className:
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/30 text-secondary text-body-sm font-semibold',
    icon: 'pending',
  },
  offline: {
    label: 'Offline',
    className:
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error-container/30 text-error text-body-sm font-semibold',
    pulse: false,
  },
};
