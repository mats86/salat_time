import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/magic-link-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }

    const tokens = await verifyMagicLink(token);
    if (!tokens) {
      return NextResponse.json({ error: 'invalid' }, { status: 401 });
    }

    const response = NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    response.cookies.set('directus_session_token', '', { path: '/', maxAge: 0, httpOnly: true });
    response.cookies.set('salat_session_auth', '', { path: '/', maxAge: 0 });
    return response;
  } catch (err) {
    console.error('[magic-link] verify route error:', err);
    return NextResponse.json({ error: 'invalid' }, { status: 500 });
  }
}
