'use client';

import { useState, useEffect, useCallback } from 'react';
import { reverseGeocode } from '@/lib/geocoding';

const CACHE_KEY = 'salat_location_v2';

export type LocationSource = 'gps' | 'manual' | 'cached';

export interface Coordinates {
  lat: number;
  lng: number;
  label?: string;
  source?: LocationSource;
}

function saveLocation(data: Coordinates) {
  const payload = JSON.stringify(data);
  sessionStorage.setItem(CACHE_KEY, payload);
  localStorage.setItem(CACHE_KEY, payload);
}

function loadCached(): Coordinates | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(CACHE_KEY) ?? localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Coordinates;
  } catch {
    return null;
  }
}

export function useLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const applyLocation = useCallback(async (data: Coordinates) => {
    let label = data.label;
    if (!label) {
      label = await reverseGeocode(data.lat, data.lng);
    }
    const full: Coordinates = { ...data, label, source: data.source ?? 'manual' };
    saveLocation(full);
    setCoords(full);
    setError(null);
    setPermissionDenied(false);
    setLoading(false);
  }, []);

  const detect = useCallback(() => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const label = await reverseGeocode(lat, lng);
          await applyLocation({ lat, lng, label, source: 'gps' });
        } catch {
          await applyLocation({
            lat,
            lng,
            label: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
            source: 'gps',
          });
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Location access denied. Please allow location in browser settings or enter a city manually.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Try again or enter a city manually.');
        } else {
          setError('Could not detect location. Enter a city manually.');
        }
        const cached = loadCached();
        if (cached) setCoords({ ...cached, source: 'cached' });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, [applyLocation]);

  const setManualLocation = useCallback(
    async (lat: number, lng: number, label: string) => {
      setLoading(true);
      await applyLocation({ lat, lng, label, source: 'manual' });
    },
    [applyLocation]
  );

  useEffect(() => {
    const cached = loadCached();
    if (cached) {
      setCoords({ ...cached, source: cached.source ?? 'cached' });
      setLoading(false);
    } else {
      detect();
    }
  }, [detect]);

  return {
    coords,
    loading,
    error,
    permissionDenied,
    detect,
    setManualLocation,
    source: coords?.source,
  };
}
