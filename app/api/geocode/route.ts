import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const UA = 'SalatZeitPWA/1.0 (prayer-times-app)';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type');

  try {
    if (type === 'reverse') {
      const lat = searchParams.get('lat');
      const lng = searchParams.get('lng');
      if (!lat || !lng) {
        return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
      }
      const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=de,en`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.municipality ||
        data.address?.county;
      const country = data.address?.country;
      const label =
        city && country ? `${city}, ${country}` : data.display_name?.split(',').slice(0, 2).join(',') ?? `${lat}, ${lng}`;
      return NextResponse.json({ label, lat: parseFloat(lat), lng: parseFloat(lng) });
    }

    if (type === 'search') {
      const q = searchParams.get('q');
      if (!q) return NextResponse.json({ results: [] });
      const url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=6&accept-language=de,en`;
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const data = await res.json();
      const results = (Array.isArray(data) ? data : []).map(
        (item: { lat: string; lon: string; display_name: string }) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          label: item.display_name.split(',').slice(0, 3).join(',').trim(),
        })
      );
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
