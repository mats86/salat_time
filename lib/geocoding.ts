export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(`/api/geocode?type=reverse&lat=${lat}&lng=${lng}`);
  if (!res.ok) return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  const data = await res.json();
  return data.label ?? `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim() || query.length < 2) return [];
  const res = await fetch(`/api/geocode?type=search&q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}
