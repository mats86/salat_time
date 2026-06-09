import { NextRequest, NextResponse } from 'next/server';
import {
  buildDevRelayAcceptUrl,
  fetchDirectusUserWithSession,
  getDirectusSessionToken,
  isAllowedDevRelayOrigin,
  isLocalDevHostname,
} from '@/lib/oauth-session-server';
import { isAdmin, isStaff } from '@/lib/auth';

function resolvePostLoginPath(
  request: NextRequest,
  user: NonNullable<Awaited<ReturnType<typeof fetchDirectusUserWithSession>>>
) {
  const redirectTo = request.nextUrl.searchParams.get('redirect');
  if (redirectTo) return redirectTo;
  if (isAdmin(user)) return '/admin';
  if (isStaff(user)) return '/staff';
  return '/staff';
}

function completeSessionLogin(
  request: NextRequest,
  sessionToken: string,
  user: NonNullable<Awaited<ReturnType<typeof fetchDirectusUserWithSession>>>
) {
  const path = resolvePostLoginPath(request, user);
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set('directus_session_token', sessionToken, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    httpOnly: true,
  });
  response.cookies.set('salat_session_auth', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    httpOnly: false,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const access = request.nextUrl.searchParams.get('access_token');
  if (access) {
    const url = new URL('/auth/callback', request.url);
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  const sessionToken = getDirectusSessionToken(request);
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth', request.url));
  }

  const user = await fetchDirectusUserWithSession(sessionToken);
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth', request.url));
  }

  const relay = request.nextUrl.searchParams.get('relay');
  if (relay && isAllowedDevRelayOrigin(relay)) {
    const acceptUrl = buildDevRelayAcceptUrl(relay, sessionToken);
    return NextResponse.redirect(acceptUrl);
  }

  return completeSessionLogin(request, sessionToken, user);
}
