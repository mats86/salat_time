import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/magic-link-server';

export const dynamic = 'force-dynamic';

const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(email: string): boolean {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: true, message: 'generic' });
    }

    if (!checkRateLimit(email)) {
      return NextResponse.json({ ok: true, message: 'generic' });
    }

    const result = await createMagicLink(email);

    if (!result) {
      return NextResponse.json({ ok: true, message: 'generic' });
    }

    return NextResponse.json({ ok: true, message: 'generic', url: result.url });
  } catch (err) {
    console.error('[magic-link] request route error:', err);
    return NextResponse.json({ ok: true, message: 'generic' });
  }
}
