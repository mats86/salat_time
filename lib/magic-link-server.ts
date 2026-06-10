import { createHash, randomBytes } from 'crypto';
import type { DirectusUser } from '@/types';

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

function getDirectusOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!envUrl || envUrl.startsWith('/api')) return 'https://directus.alattas.de';
  return envUrl.replace(/\/+$/, '');
}

function getServiceToken() {
  return process.env.DIRECTUS_SERVICE_TOKEN ?? process.env.DIRECTUS_STATIC_TOKEN ?? '';
}

function getMagicLinkInternalSecret() {
  return process.env.MAGIC_LINK_INTERNAL_SECRET ?? '';
}

function getAppOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://salat-time.alattas.de'
  );
}

export function generateRawToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

async function directusFetch(path: string, init?: RequestInit) {
  const token = getServiceToken();
  if (!token) throw new Error('DIRECTUS_SERVICE_TOKEN is not configured');

  const res = await fetch(`${getDirectusOrigin()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  return res;
}

async function readDirectusError(res: Response): Promise<string> {
  const json = await res.json().catch(() => null);
  const msg = json?.errors?.[0]?.message;
  return msg ? `${res.status}: ${msg}` : `HTTP ${res.status}`;
}

export async function findUserByEmail(email: string): Promise<DirectusUser | null> {
  const trimmed = email.trim();
  const lowered = trimmed.toLowerCase();
  const params = new URLSearchParams({
    limit: '1',
    fields: 'id,email,first_name,last_name',
  });
  params.set('filter[_or][0][email][_eq]', trimmed);
  params.set('filter[_or][1][email][_eq]', lowered);

  const res = await directusFetch(`/users?${params}`);
  if (!res.ok) {
    console.error('[magic-link] findUserByEmail failed:', await readDirectusError(res));
    return null;
  }
  const json = await res.json().catch(() => null);
  const user = json?.data?.[0] as DirectusUser | undefined;
  return user ?? null;
}

async function invalidateOpenLinksForUser(userId: string) {
  const now = new Date().toISOString();
  const params = new URLSearchParams({
    'filter[user][_eq]': userId,
    'filter[used_at][_null]': 'true',
    'filter[expires_at][_gt]': now,
    fields: 'id',
    limit: '100',
  });
  const res = await directusFetch(`/items/magic_login_links?${params}`);
  if (!res.ok) return;
  const json = await res.json().catch(() => null);
  const items = (json?.data ?? []) as { id: string }[];
  const usedAt = new Date().toISOString();
  await Promise.all(
    items.map((item) =>
      directusFetch(`/items/magic_login_links/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ used_at: usedAt }),
      })
    )
  );
}

export async function createMagicLink(
  email: string
): Promise<{ url: string } | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  if (!getServiceToken()) {
    console.error('[magic-link] No DIRECTUS_SERVICE_TOKEN or DIRECTUS_STATIC_TOKEN configured');
    return null;
  }

  const user = await findUserByEmail(normalized);
  if (!user) {
    console.error('[magic-link] No Directus user for email:', normalized);
    return null;
  }

  await invalidateOpenLinksForUser(user.id);

  const rawToken = generateRawToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString();

  const res = await directusFetch('/items/magic_login_links', {
    method: 'POST',
    body: JSON.stringify({
      user: user.id,
      email: user.email?.toLowerCase() ?? normalized,
      token_hash: hashToken(rawToken),
      expires_at: expiresAt,
    }),
  });

  if (!res.ok) {
    console.error('[magic-link] create item failed:', await readDirectusError(res));
    return null;
  }

  const url = `${getAppOrigin()}/auth/magic?token=${encodeURIComponent(rawToken)}`;
  return { url };
}

async function verifyViaExtension(
  rawToken: string
): Promise<{ access_token: string; refresh_token: string } | null> {
  const internalSecret = getMagicLinkInternalSecret();
  if (!internalSecret) {
    console.error('[magic-link] MAGIC_LINK_INTERNAL_SECRET is not configured');
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Magic-Link-Secret': internalSecret,
  };

  const serviceToken = getServiceToken();
  if (serviceToken) {
    headers.Authorization = `Bearer ${serviceToken}`;
  }

  const res = await fetch(`${getDirectusOrigin()}/magic-link-auth/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ token: rawToken }),
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('[magic-link] extension verify failed:', await readDirectusError(res));
    return null;
  }

  const json = await res.json().catch(() => null);
  const access = json?.access_token as string | undefined;
  const refresh = json?.refresh_token as string | undefined;
  if (!access || !refresh) return null;

  return { access_token: access, refresh_token: refresh };
}

export async function verifyMagicLink(rawToken: string): Promise<{
  access_token: string;
  refresh_token: string;
} | null> {
  if (!rawToken?.trim()) return null;
  return verifyViaExtension(rawToken.trim());
}
