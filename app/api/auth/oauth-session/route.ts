import { NextRequest, NextResponse } from 'next/server';

function getDirectusOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!envUrl || envUrl.startsWith('/api')) return 'https://directus.alattas.de';
  return envUrl.replace(/\/+$/, '');
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('directus_session_token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'no_session' }, { status: 401 });
  }

  const origin = getDirectusOrigin();
  const cookieHeader = `directus_session_token=${sessionToken}`;

  for (const body of [{ mode: 'json' }, {}]) {
    const upstream = await fetch(`${origin}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!upstream.ok) continue;

    const json = await upstream.json().catch(() => null);
    const access = json?.data?.access_token as string | undefined;
    const refresh = json?.data?.refresh_token as string | undefined;
    if (access) {
      return NextResponse.json({ access_token: access, refresh_token: refresh });
    }
  }

  return NextResponse.json({ error: 'refresh_failed' }, { status: 401 });
}
