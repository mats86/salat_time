import { NextRequest, NextResponse } from 'next/server';

function getDirectusOrigin() {
  const envUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
  if (!envUrl || envUrl.startsWith('/api')) return 'https://directus.alattas.de';
  return envUrl.replace(/\/+$/, '');
}

async function proxy(request: NextRequest, method: string, path: string[]) {
  const origin = getDirectusOrigin();
  const search = request.nextUrl.search || '';
  const target = `${origin}/${path.join('/')}${search}`;

  const isAuthRoute = path[0] === 'auth';
  const isCredentialLogin = isAuthRoute && path[1] === 'login' && method === 'POST';
  const cookie = request.headers.get('cookie');
  const hasSessionCookie = cookie?.includes('directus_session_token=') ?? false;

  const headers = new Headers();
  const passthrough = ['authorization', 'content-type', 'accept'];
  for (const key of passthrough) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (cookie && isAuthRoute && !isCredentialLogin) {
    headers.set('cookie', cookie);
  } else if (cookie && hasSessionCookie && !isAuthRoute) {
    headers.set('cookie', cookie);
  }

  if (
    !isAuthRoute &&
    !headers.has('authorization') &&
    !hasSessionCookie &&
    process.env.DIRECTUS_STATIC_TOKEN
  ) {
    headers.set('Authorization', `Bearer ${process.env.DIRECTUS_STATIC_TOKEN}`);
  }

  const init: RequestInit = {
    method,
    headers,
    cache: 'no-store',
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(target, init);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        errors: [
          {
            message:
              error instanceof Error ? error.message : 'Directus proxy request failed',
          },
        ],
      },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, 'GET', params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, 'POST', params.path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, 'PATCH', params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxy(request, 'DELETE', params.path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': 'authorization, content-type, accept',
    },
  });
}
