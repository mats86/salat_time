import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeDirectusSessionForTokens,
  fetchDirectusUserWithSession,
  getDirectusSessionToken,
} from '@/lib/oauth-session-server';
import { publicUrl, getPublicOrigin } from '@/lib/request-origin';
import { resolvePostLoginPath } from '@/lib/user-roles';

export const dynamic = 'force-dynamic';

function completeSessionLogin(
  request: NextRequest,
  sessionToken: string,
  user: NonNullable<Awaited<ReturnType<typeof fetchDirectusUserWithSession>>>
) {
  const redirectTo = request.nextUrl.searchParams.get('redirect');
  const path = resolvePostLoginPath(user, redirectTo);
  const response = NextResponse.redirect(publicUrl(request, path));
  const secure = getPublicOrigin(request).startsWith('https://');

  response.cookies.set('directus_session_token', sessionToken, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    secure,
    httpOnly: true,
  });
  response.cookies.set('salat_session_auth', '1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    secure,
    httpOnly: false,
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const access = request.nextUrl.searchParams.get('access_token');
    if (access) {
      const url = publicUrl(request, '/auth/callback');
      url.search = request.nextUrl.search;
      return NextResponse.redirect(url);
    }

    const sessionToken = getDirectusSessionToken(request);
    if (!sessionToken) {
      return NextResponse.redirect(publicUrl(request, '/auth/login?error=oauth'));
    }

    const tokens = await exchangeDirectusSessionForTokens(sessionToken);
    if (tokens) {
      const url = publicUrl(request, '/auth/callback');
      url.searchParams.set('access_token', tokens.access_token);
      url.searchParams.set('refresh_token', tokens.refresh_token);
      return NextResponse.redirect(url);
    }

    const user = await fetchDirectusUserWithSession(sessionToken);
    if (!user) {
      return NextResponse.redirect(publicUrl(request, '/auth/login?error=oauth'));
    }

    return completeSessionLogin(request, sessionToken, user);
  } catch {
    return NextResponse.redirect(publicUrl(request, '/auth/login?error=oauth'));
  }
}
