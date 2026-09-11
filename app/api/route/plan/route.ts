import { NextRequest, NextResponse } from 'next/server';
import { createDirectus, rest, staticToken, readItems } from '@directus/sdk';
import type { DirectusSchema } from '@/lib/directus';
import {
  distanceToRouteKm,
  isOsrmProfile,
  routePositionKm,
  type OsrmProfile,
  type RouteCoordinate,
} from '@/lib/route';
import type { Mosque, RouteMosque, RoutePlan } from '@/types';

const OSRM_BASE = 'https://router.project-osrm.org';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  expires: number;
  data: RoutePlan;
}

const planCache = new Map<string, CacheEntry>();

function getClient() {
  const url = process.env.NEXT_PUBLIC_DIRECTUS_URL ?? 'https://directus.alattas.de';
  const token = process.env.DIRECTUS_STATIC_TOKEN;
  if (!token) {
    throw new Error('DIRECTUS_STATIC_TOKEN is not configured');
  }
  return createDirectus<DirectusSchema>(url).with(staticToken(token)).with(rest());
}

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function cacheKey(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: OsrmProfile,
  bufferKm: number
): string {
  return `${roundCoord(startLat)},${roundCoord(startLng)}|${roundCoord(endLat)},${roundCoord(endLng)}|${profile}|${bufferKm}`;
}

async function fetchOsrmRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  profile: OsrmProfile
): Promise<{ geometry: RouteCoordinate[]; distanceKm: number; durationMin: number }> {
  const coords = `${startLng},${startLat};${endLng},${endLat}`;
  const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'SalatZeitPWA/1.0 (route-planner)' },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error('OSRM routing failed');
  }

  const json = (await res.json()) as {
    code?: string;
    routes?: Array<{
      geometry?: { coordinates?: RouteCoordinate[] };
      distance?: number;
      duration?: number;
    }>;
  };

  if (json.code !== 'Ok' || !json.routes?.[0]?.geometry?.coordinates?.length) {
    throw new Error('No route found');
  }

  const route = json.routes[0];
  return {
    geometry: route.geometry!.coordinates!,
    distanceKm: (route.distance ?? 0) / 1000,
    durationMin: (route.duration ?? 0) / 60,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const startLat = parseFloat(searchParams.get('startLat') ?? '');
  const startLng = parseFloat(searchParams.get('startLng') ?? '');
  const endLat = parseFloat(searchParams.get('endLat') ?? '');
  const endLng = parseFloat(searchParams.get('endLng') ?? '');
  const profileParam = searchParams.get('profile') ?? 'driving';
  const bufferKm = parseFloat(searchParams.get('bufferKm') ?? '2');

  if (
    Number.isNaN(startLat) ||
    Number.isNaN(startLng) ||
    Number.isNaN(endLat) ||
    Number.isNaN(endLng)
  ) {
    return NextResponse.json({ errors: [{ message: 'Invalid coordinates' }] }, { status: 400 });
  }

  if (!isOsrmProfile(profileParam)) {
    return NextResponse.json({ errors: [{ message: 'Invalid profile' }] }, { status: 400 });
  }

  if (Number.isNaN(bufferKm) || bufferKm < 0.5 || bufferKm > 5) {
    return NextResponse.json({ errors: [{ message: 'bufferKm must be between 0.5 and 5' }] }, { status: 400 });
  }

  const profile = profileParam;
  const key = cacheKey(startLat, startLng, endLat, endLng, profile, bufferKm);
  const cached = planCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ data: cached.data });
  }

  try {
    const { geometry, distanceKm, durationMin } = await fetchOsrmRoute(
      startLat,
      startLng,
      endLat,
      endLng,
      profile
    );

    const client = getClient();
    const items = await client.request(
      readItems('mosques', {
        filter: { status: { _eq: 'published' } },
        fields: ['*'],
        limit: 200,
      })
    );

    const mosques: RouteMosque[] = (items as Mosque[])
      .filter((m) => m.latitude != null && m.longitude != null)
      .map((m) => {
        const point = { lat: m.latitude!, lng: m.longitude! };
        const distanceFromRouteKm = distanceToRouteKm(point, geometry);
        const routePosKm = routePositionKm(point, geometry);
        return {
          ...m,
          distanceFromRouteKm,
          routePositionKm: routePosKm,
          detourMinutes: null,
        };
      })
      .filter((m) => m.distanceFromRouteKm <= bufferKm)
      .sort((a, b) => a.routePositionKm - b.routePositionKm);

    const data: RoutePlan = {
      geometry,
      distanceKm,
      durationMin,
      mosques,
    };

    planCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to plan route';
    return NextResponse.json({ errors: [{ message }] }, { status: 500 });
  }
}
