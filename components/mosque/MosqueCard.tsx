'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/components/providers/LangProvider';
import { getMosqueName } from '@/lib/i18n';
import { getMosqueImage } from '@/lib/mosque-images';
import type { Mosque } from '@/types';

interface MosqueCardProps {
  mosque: Mosque;
  showJummah?: boolean;
  jamaahTime?: string;
}

export function MosqueCard({
  mosque,
  showJummah,
  jamaahTime = '16:00',
}: MosqueCardProps) {
  const { lang, tr } = useLang();
  const name = getMosqueName(mosque, lang);
  const imageUrl = getMosqueImage(mosque.name);

  return (
    <Link
      href={`/mosque/${mosque.id}`}
      className="flex-none w-72 glass-card rounded-xl border border-outline-variant/20 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform block"
    >
      <div className="h-32 bg-surface-container-high relative">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover opacity-60"
          sizes="288px"
          unoptimized
        />
        {showJummah && (
          <div className="absolute top-3 start-3 bg-background/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-label-caps text-secondary border border-secondary/20 uppercase tracking-wider">
            {tr.jummahRelevant}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-title-md text-title-md text-on-surface truncate">{name}</h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {mosque.distance_km != null ? `${mosque.distance_km.toFixed(1)} ${tr.distanceUnit}` : ''}
            {mosque.address || mosque.city
              ? ` • ${mosque.address ?? mosque.city}`
              : ''}
          </p>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
          <div className="flex flex-col">
            <span className="font-label-caps text-[10px] text-tertiary tracking-wider">
              {tr.asrJamaah}
            </span>
            <span className="font-title-md text-title-md text-on-surface">{jamaahTime}</span>
          </div>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (mosque.latitude && mosque.longitude) {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`,
                  '_blank'
                );
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (mosque.latitude && mosque.longitude) {
                  window.open(
                    `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`,
                    '_blank'
                  );
                }
              }
            }}
            className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20"
            aria-label={tr.directions}
          >
            <span className="material-symbols-outlined">directions</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
