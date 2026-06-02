'use client';

import { useLang } from '@/components/providers/LangProvider';
import { getMosqueName } from '@/lib/i18n';
import { MosqueBadges } from './MosqueBadges';
import { Button } from '@/components/ui/Button';
import type { Mosque } from '@/types';

interface MosqueSheetProps {
  mosque: Mosque | null;
  onClose: () => void;
}

export function MosqueSheet({ mosque, onClose }: MosqueSheetProps) {
  const { lang, tr } = useLang();
  if (!mosque) return null;

  const name = getMosqueName(mosque, lang);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-surface border border-outline/30 rounded-t-stitch md:rounded-stitch p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-headline text-xl text-gold">{name}</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-on-surface-variant text-sm mb-4">{mosque.address}</p>
        <MosqueBadges mosque={mosque} />
        {mosque.opening_hours && (
          <div className="mt-4">
            <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">
              {tr.openingHours}
            </p>
            <p className="text-pale text-sm whitespace-pre-line">{mosque.opening_hours}</p>
          </div>
        )}
        <Button
          className="w-full mt-6"
          onClick={() => window.open(mapsUrl, '_blank')}
        >
          <span className="material-symbols-outlined text-lg mr-2">directions</span>
          {tr.openInMaps}
        </Button>
      </div>
    </div>
  );
}
