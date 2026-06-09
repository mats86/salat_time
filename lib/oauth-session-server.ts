import { NextRequest, NextResponse } from 'next/server';
import type { DirectusUser } from '@/types';

function getDirectusOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!envUrl || envUrl.startsWith('/api')) return 'https://directus.alattas.de';
  return envUrl.replace(/\/+$/, '');
}

export function getDirectusSessionToken(request: NextRequest): string | null {
  const fromCookies = request.cookies.get('directus_session_token')?.value;
  if (fromCookies) return fromCookies;

  const header = request.headers.get('cookie');
  if (!header) return null;

  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === 'directus_session_token') {
      return rest.join('=');
    }
  }

  return null;
}

export async function fetchDirectusUserWithSession(
  sessionToken: string
): Promise<DirectusUser | null> {
  const origin = getDirectusOrigin();
  const res = await fetch(`${origin}/users/me?fields=*,role.*`, {
    headers: { Cookie: `directus_session_token=${sessionToken}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data as DirectusUser | undefined) ?? null;
}

export function isLocalDevHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function isAllowedDevRelayOrigin(relay: string): boolean {
  try {
    const url = new URL(relay);
    return url.protocol === 'http:' && isLocalDevHostname(url.hostname);
  } catch {
    return false;
  }
}

export function buildDevRelayAcceptUrl(relayOrigin: string, sessionToken: string): URL {
  const acceptUrl = new URL('/auth/callback/accept', relayOrigin);
  acceptUrl.searchParams.set('session_token', sessionToken);
  return acceptUrl;
}

export async function verifyOAuthSession(request: NextRequest) {
  const sessionToken = getDirectusSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  const user = await fetchDirectusUserWithSession(sessionToken);
  if (!user) {
    return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
  }

  return NextResponse.json({ auth_mode: 'session', user });
}
