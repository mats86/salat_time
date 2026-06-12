import { createDirectus, rest, staticToken, readItems, readItem } from '@directus/sdk';
import type { DirectusSchema } from '@/lib/directus';
import type { Mosque, MosqueEvent, MosquePrayerTimes, ChangeRequest, MosqueStaff } from '@/types';

const directusUrl =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';

export function getServerDirectus() {
  const token = process.env.DIRECTUS_STATIC_TOKEN;
  if (!token) {
    throw new Error('DIRECTUS_STATIC_TOKEN is not set');
  }
  return createDirectus<DirectusSchema>(directusUrl)
    .with(staticToken(token))
    .with(rest());
}

export async function fetchPublishedMosques() {
  const client = getServerDirectus();
  return client.request(
    readItems('mosques', {
      filter: { status: { _eq: 'published' } },
      fields: ['*'],
      limit: 100,
    })
  );
}

export async function fetchMosqueById(id: string) {
  const client = getServerDirectus();
  return client.request(readItem('mosques', id, { fields: ['*'] }));
}

export async function fetchPrayerTimesForMosque(mosqueId: string) {
  const client = getServerDirectus();
  const items = await client.request(
    readItems('mosque_prayer_times', {
      filter: {
        mosque_id: { _eq: mosqueId },
        status: { _eq: 'approved' },
      },
      limit: 1,
    })
  );
  return items[0] ?? null;
}

export async function fetchPendingChangeRequests() {
  const client = getServerDirectus();
  return client.request(
    readItems('change_requests', {
      filter: { status: { _eq: 'pending' } },
      fields: ['*'],
    })
  );
}

export async function fetchAllChangeRequests() {
  const client = getServerDirectus();
  return client.request(
    readItems('change_requests', {
      fields: ['*'],
      limit: 50,
    })
  );
}

export async function fetchRecentChangeRequests(limit = 5) {
  const client = getServerDirectus();
  return client.request(
    readItems('change_requests', {
      fields: ['*'],
      sort: ['-date_created'],
      limit,
    })
  );
}

export async function fetchMosqueStaff() {
  const client = getServerDirectus();
  return client.request(
    readItems('mosque_staff', {
      fields: ['*'],
    })
  );
}

export async function fetchMosqueEvents(mosqueId: string) {
  const client = getServerDirectus();
  return client.request(
    readItems('mosque_events', {
      filter: {
        mosque_id: { _eq: mosqueId },
        status: { _eq: 'published' },
      },
    })
  );
}

export type { Mosque, MosqueEvent, MosquePrayerTimes, ChangeRequest, MosqueStaff };
