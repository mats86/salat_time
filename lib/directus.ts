import {
  createDirectus,
  rest,
  authentication,
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
} from '@directus/sdk';
import type { Mosque, MosqueEvent, MosquePrayerTimes, ChangeRequest, MosqueStaff } from '@/types';

export interface DirectusSchema {
  mosques: Mosque[];
  mosque_prayer_times: MosquePrayerTimes[];
  mosque_events: MosqueEvent[];
  mosque_staff: MosqueStaff[];
  change_requests: ChangeRequest[];
}

const directusUrl =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';

const directus = createDirectus<DirectusSchema>(directusUrl)
  .with(authentication('json'))
  .with(rest());

export default directus;

export {
  readItems,
  readItem,
  createItem,
  updateItem,
  deleteItem,
};

export function getAssetUrl(fileId: string | null | undefined): string | null {
  if (!fileId) return null;
  return `${directusUrl}/assets/${fileId}`;
}
