import type { ChangeRequest } from '@/types';

export const REQUEST_TYPE_META: Record<
  ChangeRequest['type'],
  { label: string; icon: string; badgeClass: string }
> = {
  prayer_times: {
    label: 'Time Change',
    icon: 'schedule',
    badgeClass: 'bg-primary-container/30 text-primary',
  },
  event: {
    label: 'New Event',
    icon: 'event',
    badgeClass: 'bg-tertiary-container/30 text-tertiary',
  },
  mosque_info: {
    label: 'Announcement',
    icon: 'campaign',
    badgeClass: 'bg-primary-container/30 text-primary',
  },
  new_mosque: {
    label: 'New Mosque',
    icon: 'mosque',
    badgeClass: 'bg-primary-container/30 text-primary',
  },
};

export const STATUS_META: Record<
  ChangeRequest['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'PENDING',
    className:
      'text-label-caps font-label-caps text-secondary bg-secondary-container/10 px-3 py-1 rounded border border-secondary/20',
  },
  approved: {
    label: 'APPROVED',
    className:
      'text-label-caps font-label-caps text-tertiary bg-tertiary-container/10 px-3 py-1 rounded border border-tertiary/20',
  },
  rejected: {
    label: 'REJECTED',
    className:
      'text-label-caps font-label-caps text-error bg-error-container/10 px-3 py-1 rounded border border-error/20',
  },
};

export const MOBILE_STATUS_META: Record<
  ChangeRequest['status'],
  { label: string; className: string }
> = {
  pending: {
    label: 'PENDING',
    className:
      'px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-label-caps',
  },
  approved: {
    label: 'APPROVED',
    className:
      'px-2 py-0.5 rounded-full bg-tertiary-container/40 text-tertiary text-[10px] font-label-caps',
  },
  rejected: {
    label: 'REJECTED',
    className:
      'px-2 py-0.5 rounded-full bg-error-container/20 text-error text-[10px] font-label-caps',
  },
};

export function formatStatValue(value: number, pad = false): string {
  if (pad && value < 10) return value.toString().padStart(2, '0');
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
}

export function getMosqueLabel(
  mosqueId: string | null | undefined,
  mosques: { id: string; name: string; city?: string | null }[]
): { name: string; location: string } {
  if (!mosqueId) return { name: 'Unknown Mosque', location: '—' };
  const mosque = mosques.find((m) => m.id === mosqueId);
  if (!mosque) return { name: 'Unknown Mosque', location: '—' };
  return {
    name: mosque.name,
    location: mosque.city ? `${mosque.city}, DE` : '—',
  };
}
