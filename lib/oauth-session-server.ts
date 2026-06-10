import { NextRequest, NextResponse } from 'next/server';
import type { DirectusUser } from '@/types';

function getDirectusOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!envUrl || envUrl.startsWith('/api')) return 'https://directus.alattas.de';
  return envUrl.replace(/\/+$/, '');
}

export function getDirectusSessionToken(request: NextRequest): string | null {
  const fromQuery =
    request.nextUrl.searchParams.get('directus_session_token') ??
    request.nextUrl.searchParams.get('session_token');
  if (fromQuery) return fromQuery;

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
  const cookieHeader = `directus_session_token=${sessionToken}`;

  await fetch(`${origin}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ mode: 'session' }),
    cache: 'no-store',
  }).catch(() => null);

  const res = await fetch(`${origin}/users/me?fields=*,role.*`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return (json?.data as DirectusUser | undefined) ?? null;
}

export async function exchangeDirectusSessionForTokens(
  sessionToken: string
): Promise<{ access_token: string; refresh_token: string } | null> {
  const origin = getDirectusOrigin();
  const cookieHeader = `directus_session_token=${sessionToken}`;

  const res = await fetch(`${origin}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ mode: 'json' }),
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const json = await res.json().catch(() => null);
  const access =
    (json?.data?.access_token as string | undefined) ??
    (json?.access_token as string | undefined);
  const refresh =
    (json?.data?.refresh_token as string | undefined) ??
    (json?.refresh_token as string | undefined);

  if (!access || !refresh) return null;

  return { access_token: access, refresh_token: refresh };
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
