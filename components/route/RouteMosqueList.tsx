'use client';

import Link from 'next/link';
import { useLang } from '@/components/providers/LangProvider';
import { MosqueBadges } from '@/components/mosque/MosqueBadges';
import { Card } from '@/components/ui/Card';
import { getMosqueName } from '@/lib/i18n';
import type { RouteMosque } from '@/types';

function formatRouteDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface RouteMosqueListProps {
  mosques: RouteMosque[];
  emptyMessage?: string;
}

export function RouteMosqueList({ mosques, emptyMessage }: RouteMosqueListProps) {
  const { lang, tr } = useLang();

  if (!mosques.length) {
    return (
      <Card className="p-6 text-center">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">mosque</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {emptyMessage ?? tr.routeEmpty}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-label-caps text-[11px] text-on-surface-variant">
        {tr.routeMosquesFound.replace('{count}', String(mosques.length))}
      </p>
      <ol className="space-y-3">
        {mosques.map((mosque, index) => (
          <li key={mosque.id}>
            <Link href={`/mosque/${mosque.id}`}>
              <Card className="p-4 hover:border-secondary/40 transition-colors">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-title-md text-title-md text-secondary">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h3 className="font-title-md text-title-md text-on-surface truncate">
                        {getMosqueName(mosque, lang)}
                      </h3>
                      {mosque.city && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{mosque.city}</p>
                      )}
                    </div>
                    <p className="font-body-sm text-body-sm text-secondary">
                      {tr.routeFromRoute}: {formatRouteDistance(mosque.distanceFromRouteKm)}
                    </p>
                    <MosqueBadges mosque={mosque} />
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant self-center">
                    chevron_right
                  </span>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
