import { NextRequest, NextResponse } from 'next/server';
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { DirectusSchema } from '@/lib/directus';
import { haversineKm } from '@/lib/aladhan';

function getClient() {
  const url = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';
  const token = process.env.DIRECTUS_STATIC_TOKEN;
  if (!token) {
    throw new Error('DIRECTUS_STATIC_TOKEN is not configured');
  }
  return createDirectus<DirectusSchema>(url).with(staticToken(token)).with(rest());
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radiusKm = parseFloat(searchParams.get('radius') ?? '50');

  try {
    const client = getClient();
    const items = await client.request(
      readItems('mosques', {
        filter: { status: { _eq: 'published' } },
        fields: ['*'],
        limit: 200,
      })
    );

    let result = items.filter((m) => m.latitude != null && m.longitude != null);

    if (lat != null && lng != null) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
        result = result
          .map((m) => ({
            ...m,
            distance_km: haversineKm(latNum, lngNum, m.latitude!, m.longitude!),
          }))
          .filter((m) => m.distance_km <= radiusKm)
          .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load mosques';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
