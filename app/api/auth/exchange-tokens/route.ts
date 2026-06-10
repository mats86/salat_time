import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeDirectusSessionForTokens,
  getDirectusSessionToken,
} from '@/lib/oauth-session-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const sessionToken = getDirectusSessionToken(request);
  if (!sessionToken) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  const tokens = await exchangeDirectusSessionForTokens(sessionToken);
  if (!tokens) {
    return NextResponse.json({ error: 'exchange_failed' }, { status: 401 });
  }

  const response = NextResponse.json({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });

  response.cookies.set('directus_session_token', '', { path: '/', maxAge: 0 });
  response.cookies.set('salat_session_auth', '', { path: '/', maxAge: 0 });

  return response;
}
