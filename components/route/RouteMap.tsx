'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLang } from '@/components/providers/LangProvider';
import { getMosqueName } from '@/lib/i18n';
import { coordinatesToLatLngPairs } from '@/lib/route';
import type { RouteMosque, RoutePlan } from '@/types';

const mosqueIcon = new L.DivIcon({
  className: 'route-mosque-marker',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#c9a84c;border:2px solid #0f2318;box-shadow:0 0 6px rgba(201,168,76,0.6)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [map, points]);

  return null;
}

function formatRouteDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface RouteMapProps {
  plan: RoutePlan;
  className?: string;
}

export function RouteMap({ plan, className }: RouteMapProps) {
  const { lang, tr } = useLang();
  const routeLatLng = coordinatesToLatLngPairs(plan.geometry);
  const mosquePoints: [number, number][] = plan.mosques
    .filter((m) => m.latitude != null && m.longitude != null)
    .map((m) => [m.latitude!, m.longitude!]);
  const allPoints = [...routeLatLng, ...mosquePoints];
  const center = routeLatLng[0] ?? [51.1657, 10.4515];

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={8}
        scrollWheelZoom
        className="h-full w-full rounded-stitch z-0"
        style={{ minHeight: 280 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routeLatLng.length >= 2 && (
          <>
            <Polyline positions={routeLatLng} pathOptions={{ color: '#5fa87a', weight: 5, opacity: 0.9 }} />
            <FitBounds points={allPoints.length >= 2 ? allPoints : routeLatLng} />
          </>
        )}
        {plan.mosques.map((mosque) => (
          <MosqueMarker key={mosque.id} mosque={mosque} lang={lang} tr={tr} />
        ))}
      </MapContainer>
    </div>
  );
}

function MosqueMarker({
  mosque,
  lang,
  tr,
}: {
  mosque: RouteMosque;
  lang: Parameters<typeof getMosqueName>[1];
  tr: { routeFromRoute: string; mosqueDetail: string };
}) {
  if (mosque.latitude == null || mosque.longitude == null) return null;

  return (
    <Marker position={[mosque.latitude, mosque.longitude]} icon={mosqueIcon}>
      <Popup>
        <div className="text-sm space-y-1 min-w-[160px]">
          <p className="font-semibold text-[#0f2318]">{getMosqueName(mosque, lang)}</p>
          {mosque.city && <p className="text-gray-600">{mosque.city}</p>}
          <p className="text-gray-700">
            {tr.routeFromRoute}: {formatRouteDistance(mosque.distanceFromRouteKm)}
          </p>
          <Link href={`/mosque/${mosque.id}`} className="text-[#1a3a2a] underline">
            {tr.mosqueDetail}
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
