'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { searchPlaces, type GeocodeResult } from '@/lib/geocoding';
import type { OsrmProfile } from '@/lib/route';
import { cn } from '@/lib/utils';
import type { RoutePoint } from '@/types';

const BUFFER_OPTIONS = [0.5, 1, 2, 5] as const;

interface RouteSearchFormProps {
  start: RoutePoint | null;
  end: RoutePoint | null;
  onStartChange: (point: RoutePoint | null) => void;
  onEndChange: (point: RoutePoint | null) => void;
  profile: OsrmProfile;
  onProfileChange: (profile: OsrmProfile) => void;
  bufferKm: number;
  onBufferChange: (km: number) => void;
  onCalculate: () => void;
  onUseMyLocation: () => void;
  loading?: boolean;
  loadingGps?: boolean;
  canCalculate?: boolean;
}

function PlaceField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: RoutePoint | null;
  onChange: (point: RoutePoint | null) => void;
}) {
  const { tr } = useLang();
  const [query, setQuery] = useState(value?.label ?? '');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value?.label ?? '');
  }, [value]);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const places = await searchPlaces(q);
    setResults(places);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => runSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  const selectPlace = (place: GeocodeResult) => {
    onChange({ lat: place.lat, lng: place.lng, label: place.label });
    setQuery(place.label);
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block font-label-caps text-[11px] text-on-surface-variant mb-1.5">
        {label}
      </label>
      <Input
        id={id}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (searching || results.length > 0 || query.length >= 2) && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-outline/20 bg-surface shadow-lg max-h-48 overflow-y-auto">
          {searching && (
            <div className="flex items-center gap-2 px-3 py-2 text-on-surface-variant">
              <Spinner className="h-4 w-4" />
              <span className="font-body-sm text-body-sm">{tr.loading}</span>
            </div>
          )}
          {!searching && results.length === 0 && query.length >= 2 && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">{tr.noResults}</p>
          )}
          {results.map((place) => (
            <button
              key={`${place.lat}-${place.lng}-${place.label}`}
              type="button"
              onClick={() => selectPlace(place)}
              className="w-full text-start px-3 py-2.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-variant transition"
            >
              {place.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteSearchForm({
  start,
  end,
  onStartChange,
  onEndChange,
  profile,
  onProfileChange,
  bufferKm,
  onBufferChange,
  onCalculate,
  onUseMyLocation,
  loading,
  loadingGps,
  canCalculate,
}: RouteSearchFormProps) {
  const { tr } = useLang();

  const modes: { id: OsrmProfile | 'transit'; icon: string; label: string; disabled?: boolean }[] = [
    { id: 'driving', icon: 'directions_car', label: tr.routeModeCar },
    { id: 'transit', icon: 'train', label: tr.routeModeTrain, disabled: true },
    { id: 'walking', icon: 'directions_walk', label: tr.routeModeWalk, disabled: true },
    { id: 'cycling', icon: 'directions_bike', label: tr.routeModeBike, disabled: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
          {tr.routeTitle}
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tr.routeSubtitle}</p>
      </div>

      <PlaceField
        id="route-start"
        label={tr.routeFrom}
        placeholder={tr.routeFromPlaceholder}
        value={start}
        onChange={onStartChange}
      />

      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={loadingGps}
        className="flex items-center gap-2 font-body-sm text-body-sm text-secondary hover:text-primary transition disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-lg">my_location</span>
        {loadingGps ? tr.locating : tr.routeUseMyLocation}
      </button>

      <PlaceField
        id="route-end"
        label={tr.routeTo}
        placeholder={tr.routeToPlaceholder}
        value={end}
        onChange={onEndChange}
      />

      <div>
        <span className="block font-label-caps text-[11px] text-on-surface-variant mb-2">
          {tr.routeModeLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {modes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              disabled={mode.disabled}
              onClick={() => {
                if (mode.id !== 'transit' && !mode.disabled) onProfileChange(mode.id);
              }}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition',
                mode.id === profile && !mode.disabled
                  ? 'bg-primary-container border-secondary text-secondary'
                  : 'border-outline/20 text-on-surface-variant',
                mode.disabled && 'opacity-40 cursor-not-allowed'
              )}
              title={mode.disabled ? tr.routeModeComingSoon : undefined}
            >
              <span className="material-symbols-outlined text-lg">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="font-label-caps text-[11px] text-on-surface-variant">{tr.routeRadius}</span>
          <span className="font-body-sm text-body-sm text-secondary">{bufferKm} km</span>
        </div>
        <div className="flex gap-2">
          {BUFFER_OPTIONS.map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => onBufferChange(km)}
              className={cn(
                'flex-1 py-2 rounded-xl border text-sm transition',
                bufferKm === km
                  ? 'bg-primary-container border-secondary text-secondary'
                  : 'border-outline/20 text-on-surface-variant hover:border-outline/40'
              )}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canCalculate || loading}
        onClick={onCalculate}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            {tr.loading}
          </span>
        ) : (
          tr.routeCalculate
        )}
      </Button>
    </div>
  );
}
