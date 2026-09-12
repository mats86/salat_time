'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { searchPlaces, type GeocodeResult } from '@/lib/geocoding';
import type { OsrmProfile } from '@/lib/route';
import { cn } from '@/lib/utils';
import type { RoutePlan, RoutePlannerStatus, RoutePoint } from '@/types';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

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
  onCalculate: (overrides?: { start?: RoutePoint; end?: RoutePoint }) => void;
  onUseMyLocation: () => void;
  onViewResults?: () => void;
  status?: RoutePlannerStatus;
  plan?: RoutePlan | null;
  loading?: boolean;
  loadingGps?: boolean;
}

async function resolvePlaceFromQuery(query: string): Promise<RoutePoint | null> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;
  const places = await searchPlaces(trimmed);
  if (!places.length) return null;
  const place = places[0];
  return { lat: place.lat, lng: place.lng, label: place.label };
}

function PlaceField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onEnterWithoutSelection,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: RoutePoint | null;
  onChange: (point: RoutePoint | null) => void;
  onEnterWithoutSelection?: () => void;
}) {
  const { tr } = useLang();
  const [query, setQuery] = useState(value?.label ?? '');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [open, setOpen] = useState(false);

  // Sync external updates (GPS, autocomplete pick) without wiping in-progress typing.
  useEffect(() => {
    if (!value?.label) return;
    setQuery((current) => (current === '' || current === value.label ? value.label : current));
  }, [value?.label, value?.lat, value?.lng]);

  const runSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setSearching(true);
    setHasSearched(false);
    const places = await searchPlaces(q);
    setResults(places);
    setSearching(false);
    setHasSearched(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDebouncing(false);
      return;
    }
    if (query.length < 2) {
      setDebouncing(false);
      setResults([]);
      setHasSearched(false);
      return;
    }
    setDebouncing(true);
    setHasSearched(false);
    const t = setTimeout(() => {
      setDebouncing(false);
      void runSearch(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, open, runSearch]);

  const selectPlace = (place: GeocodeResult) => {
    onChange({ lat: place.lat, lng: place.lng, label: place.label });
    setQuery(place.label);
    setOpen(false);
    setResults([]);
    setHasSearched(false);
  };

  const trySelectFirst = () => {
    if (results[0]) {
      selectPlace(results[0]);
      return true;
    }
    return false;
  };

  const handleEnter = async () => {
    if (trySelectFirst()) return;
    if (query.trim().length < 2) {
      onEnterWithoutSelection?.();
      return;
    }
    setSearching(true);
    const resolved = await resolvePlaceFromQuery(query);
    setSearching(false);
    if (resolved) {
      onChange(resolved);
      setQuery(resolved.label);
      setOpen(false);
      return;
    }
    onEnterWithoutSelection?.();
  };

  const isEditingSelection = !value || query !== value.label;
  const showDropdown =
    open &&
    isEditingSelection &&
    (debouncing || searching || results.length > 0 || hasSearched);
  const showNoResults = hasSearched && !searching && !debouncing && results.length === 0 && query.length >= 2;

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
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          if (!next.trim()) {
            onChange(null);
          } else if (value && next !== value.label) {
            onChange(null);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void handleEnter();
          }
        }}
        autoComplete="off"
      />
      {value && (
        <p className="mt-1 font-body-sm text-body-sm text-secondary inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">check_circle</span>
          {tr.detected}
        </p>
      )}
      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-outline/20 bg-surface shadow-lg max-h-48 overflow-y-auto">
          {(searching || debouncing) && (
            <div className="flex items-center gap-2 px-3 py-2 text-on-surface-variant">
              <Spinner className="h-4 w-4" />
              <span className="font-body-sm text-body-sm">{tr.loading}</span>
            </div>
          )}
          {showNoResults && (
            <p className="px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">{tr.noResults}</p>
          )}
          {results.map((place) => (
            <button
              key={`${place.lat}-${place.lng}-${place.label}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
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
  onViewResults,
  status = 'idle',
  plan,
  loading,
  loadingGps,
}: RouteSearchFormProps) {
  const { tr } = useLang();
  const [selectionError, setSelectionError] = useState<string | null>(null);

  const modes: { id: OsrmProfile | 'transit'; icon: string; label: string; disabled?: boolean }[] = [
    { id: 'driving', icon: 'directions_car', label: tr.routeModeCar },
    { id: 'transit', icon: 'train', label: tr.routeModeTrain, disabled: true },
    { id: 'walking', icon: 'directions_walk', label: tr.routeModeWalk, disabled: true },
    { id: 'cycling', icon: 'directions_bike', label: tr.routeModeBike, disabled: true },
  ];

  const handleCalculate = async () => {
    setSelectionError(null);

    let resolvedStart = start;
    let resolvedEnd = end;

    if (!resolvedStart) {
      const startInput = document.getElementById('route-start') as HTMLInputElement | null;
      resolvedStart = startInput?.value ? await resolvePlaceFromQuery(startInput.value) : null;
    }

    if (!resolvedEnd) {
      const endInput = document.getElementById('route-end') as HTMLInputElement | null;
      resolvedEnd = endInput?.value ? await resolvePlaceFromQuery(endInput.value) : null;
    }

    if (!resolvedStart || !resolvedEnd) {
      setSelectionError(tr.routeNeedsSelection);
      return;
    }

    onCalculate({ start: resolvedStart, end: resolvedEnd });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:font-headline-lg md:text-headline-lg">
          {tr.routeTitle}
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{tr.routeSubtitle}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant/80 mt-1">{tr.routeSelectHint}</p>
      </div>

      <PlaceField
        id="route-start"
        label={tr.routeFrom}
        placeholder={tr.routeFromPlaceholder}
        value={start}
        onChange={onStartChange}
        onEnterWithoutSelection={() => setSelectionError(tr.routeNeedsSelection)}
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
        onEnterWithoutSelection={() => setSelectionError(tr.routeNeedsSelection)}
      />

      {selectionError && (
        <p className="font-body-sm text-body-sm text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2">
          {selectionError}
        </p>
      )}

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

      {start && end && status === 'idle' && !loading && (
        <p className="font-body-sm text-body-sm text-secondary text-center px-1">
          {tr.routeTapCalculate}
        </p>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={loading}
        onClick={() => void handleCalculate()}
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

      {status === 'done' && plan && (
        <div className="rounded-xl border border-secondary/30 bg-primary-container/40 p-3 space-y-2 lg:hidden">
          <p className="font-body-sm text-body-sm text-secondary">
            {plan.mosques.length > 0
              ? tr.routeMosquesFound.replace('{count}', String(plan.mosques.length))
              : tr.routeEmpty}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {plan.distanceKm.toFixed(1)} km · {formatDuration(plan.durationMin)}
          </p>
          <button
            type="button"
            onClick={onViewResults}
            className="w-full rounded-xl border border-secondary/40 bg-surface px-3 py-2 font-body-sm text-body-sm text-secondary hover:bg-surface-variant transition"
          >
            {tr.routeViewResults}
          </button>
        </div>
      )}
    </div>
  );
}
