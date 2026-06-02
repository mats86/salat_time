'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { searchPlaces, type GeocodeResult } from '@/lib/geocoding';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

interface LocationSheetProps {
  open: boolean;
  onClose: () => void;
  onUseGps: () => void;
  onSelectPlace: (place: GeocodeResult) => void;
  loadingGps?: boolean;
  currentLabel?: string;
}

export function LocationSheet({
  open,
  onClose,
  onUseGps,
  onSelectPlace,
  loadingGps,
  currentLabel,
}: LocationSheetProps) {
  const { tr } = useLang();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg bg-surface border border-outline-variant/30 rounded-t-xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
            {tr.changeLocation}
          </h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {currentLabel && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
            {tr.currentLocation}: <span className="text-on-surface">{currentLabel}</span>
          </p>
        )}

        <button
          type="button"
          onClick={onUseGps}
          disabled={loadingGps}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary-container border border-primary/20 text-secondary font-title-md text-title-md mb-6 disabled:opacity-60"
        >
          {loadingGps ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <span className="material-symbols-outlined">my_location</span>
          )}
          {tr.useMyLocation}
        </button>

        <p className="font-label-caps text-label-caps text-on-surface-variant mb-2 uppercase">
          {tr.searchCity}
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr.searchPlaceholder}
          className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/60 outline-none focus:border-secondary/50 mb-3"
          autoFocus
        />

        {searching && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {!searching && results.length > 0 && (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {results.map((place, i) => (
              <li key={`${place.lat}-${place.lng}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace(place);
                    onClose();
                  }}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl font-body-sm text-body-sm',
                    'text-on-surface hover:bg-surface-container-high transition'
                  )}
                >
                  <span className="material-symbols-outlined text-sm align-middle mr-2 text-tertiary">
                    location_on
                  </span>
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-4">
            {tr.noResults}
          </p>
        )}
      </div>
    </div>
  );
}
