import { NextRequest } from 'next/server';
import { verifyOAuthSession } from '@/lib/oauth-session-server';

export async function POST(request: NextRequest) {
  return verifyOAuthSession(request);
}
