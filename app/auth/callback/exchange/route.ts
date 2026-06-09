import { NextRequest, NextResponse } from 'next/server';
import {
  fetchDirectusUserWithSession,
  getDirectusSessionToken,
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

  const path = resolvePostLoginPath(request, user);
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set('salat_session_auth', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
  return response;
}
