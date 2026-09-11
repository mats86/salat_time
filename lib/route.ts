import { haversineKm } from '@/lib/aladhan';

/** GeoJSON coordinate: [longitude, latitude] */
export type RouteCoordinate = [number, number];

export interface LatLng {
  lat: number;
  lng: number;
}

function toLatLng(coord: RouteCoordinate): LatLng {
  return { lat: coord[1], lng: coord[0] };
}

function projectOnSegment(
  point: LatLng,
  a: LatLng,
  b: LatLng
): { distanceKm: number; t: number; proj: LatLng } {
  const ax = a.lng;
  const ay = a.lat;
  const bx = b.lng;
  const by = b.lat;
  const px = point.lng;
  const py = point.lat;

  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;

  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));

  const proj = { lat: ay + t * dy, lng: ax + t * dx };
  const distanceKm = haversineKm(point.lat, point.lng, proj.lat, proj.lng);

  return { distanceKm, t, proj };
}

export function pointToSegmentKm(point: LatLng, segA: LatLng, segB: LatLng): number {
  return projectOnSegment(point, segA, segB).distanceKm;
}

export function distanceToRouteKm(point: LatLng, coordinates: RouteCoordinate[]): number {
  if (coordinates.length < 2) return Infinity;

  let min = Infinity;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = toLatLng(coordinates[i]);
    const b = toLatLng(coordinates[i + 1]);
    min = Math.min(min, pointToSegmentKm(point, a, b));
  }
  return min;
}

export function routePositionKm(point: LatLng, coordinates: RouteCoordinate[]): number {
  if (coordinates.length < 2) return 0;

  let bestDist = Infinity;
  let bestPosition = 0;
  let cumulative = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = toLatLng(coordinates[i]);
    const b = toLatLng(coordinates[i + 1]);
    const segLen = haversineKm(a.lat, a.lng, b.lat, b.lng);
    const { distanceKm, t } = projectOnSegment(point, a, b);
    const position = cumulative + t * segLen;

    if (distanceKm < bestDist) {
      bestDist = distanceKm;
      bestPosition = position;
    }
    cumulative += segLen;
  }

  return bestPosition;
}

export function coordinatesToLatLngPairs(coordinates: RouteCoordinate[]): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

export type OsrmProfile = 'driving' | 'walking' | 'cycling';

export const OSRM_PROFILES: OsrmProfile[] = ['driving', 'walking', 'cycling'];

export function isOsrmProfile(value: string): value is OsrmProfile {
  return OSRM_PROFILES.includes(value as OsrmProfile);
}
