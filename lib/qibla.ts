/** Kaaba coordinates */
export const MECCA_LAT = 21.4225;
export const MECCA_LNG = 39.8262;

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** Initial bearing from user location to Mecca (0–360°, clockwise from north). */
export function calculateQiblaBearing(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const Δλ = ((MECCA_LNG - lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/** Great-circle distance in kilometres. */
export function calculateDistanceToMecca(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (MECCA_LAT * Math.PI) / 180;
  const Δφ = ((MECCA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((MECCA_LNG - lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function bearingToCardinal(bearing: number): string {
  const index = Math.round(bearing / 45) % 8;
  return CARDINALS[index];
}

export function formatDistance(km: number): string {
  return Math.round(km).toLocaleString('en-US');
}

export function formatBearing(bearing: number): string {
  return bearing.toFixed(1);
}
