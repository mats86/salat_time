import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDirectusUserWithSession,
  isLocalDevHostname,
} from '@/lib/oauth-session-server';
import { isAdmin, isStaff } from '@/lib/auth';

function resolvePostLoginPath(
  user: NonNullable<Awaited<ReturnType<typeof fetchDirectusUserWithSession>>>
) {
  if (isAdmin(user)) return '/admin';
  if (isStaff(user)) return '/staff';
  return '/staff';
}

export async function GET(request: NextRequest) {
  if (!isLocalDevHostname(request.nextUrl.hostname)) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth', request.url));
  }

  const sessionToken = request.nextUrl.searchParams.get('session_token');
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth', request.url));
  }

  const user = await fetchDirectusUserWithSession(sessionToken);
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth', request.url));
  }

  const path = resolvePostLoginPath(user);
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set('directus_session_token', sessionToken, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure: false,
    httpOnly: true,
  });
  response.cookies.set('salat_session_auth', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: false,
    httpOnly: false,
  });
  return response;
}
