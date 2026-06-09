import type { NextRequest } from 'next/server';

export function getPublicOrigin(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    try {
      const host = new URL(envUrl).hostname;
      if (host !== '0.0.0.0' && host !== '127.0.0.1') {
        return envUrl.replace(/\/$/, '');
      }
    } catch {
      /* ignore invalid env URL */
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(',')[0].trim()}`;
  }

  const host = request.headers.get('host');
  if (host && !host.startsWith('0.0.0.0')) {
    const proto = request.nextUrl.protocol.replace(':', '') || 'https';
    return `${proto}://${host}`;
  }

  return request.nextUrl.origin;
}

export function publicUrl(request: NextRequest, path: string): URL {
  return new URL(path, `${getPublicOrigin(request)}/`);
}
