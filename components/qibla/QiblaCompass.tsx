'use client';

import { useEffect, useRef } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import {
  calculateQiblaBearing,
  calculateDistanceToMecca,
  bearingToCardinal,
  formatBearing,
  formatDistance,
} from '@/lib/qibla';
import { useCompass } from '@/hooks/useCompass';

interface QiblaCompassProps {
  lat: number;
  lng: number;
}

export function QiblaCompass({ lat, lng }: QiblaCompassProps) {
  const { tr } = useLang();
  const compassRef = useRef<HTMLDivElement>(null);
  const { heading, calibrated, permissionNeeded, enableCompass } = useCompass();

  const qiblaBearing = calculateQiblaBearing(lat, lng);
  const distance = calculateDistanceToMecca(lat, lng);
  const cardinal = bearingToCardinal(qiblaBearing);

  useEffect(() => {
    const compass = compassRef.current;
    if (!compass) return;

    if (heading != null) {
      compass.style.transform = `rotate(${-heading}deg)`;
      return;
    }

    // Subtle hunting animation when no compass data
    const t1 = setTimeout(() => {
      compass.style.transform = 'rotate(5deg)';
      const t2 = setTimeout(() => {
        compass.style.transform = 'rotate(-3deg)';
        const t3 = setTimeout(() => {
          compass.style.transform = 'rotate(0deg)';
        }, 800);
        return () => clearTimeout(t3);
      }, 800);
      return () => clearTimeout(t2);
    }, 500);

    return () => clearTimeout(t1);
  }, [heading]);

  return (
    <>
      {/* Status Bar */}
      <div className="z-10 mb-8 flex items-center gap-2 bg-surface-container/60 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/10">
        <div
          className={`w-2 h-2 rounded-full ${calibrated ? 'bg-tertiary animate-pulse' : 'bg-outline-variant'}`}
        />
        <span className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">
          {calibrated ? tr.gpsCalibrated : tr.calibratingCompass}
        </span>
      </div>

      {permissionNeeded && (
        <button
          type="button"
          onClick={() => void enableCompass()}
          className="z-10 mb-4 font-body-sm text-body-sm text-secondary underline"
        >
          {tr.enableCompass}
        </button>
      )}

      {/* Interactive Compass Section */}
      <div className="relative z-10 w-full max-w-[320px] aspect-square flex items-center justify-center mb-10">
        {/* Outermost Decorative Ring */}
        <div className="absolute inset-0 rounded-full border border-secondary/10 scale-110" />

        {/* Main Compass Disk */}
        <div
          ref={compassRef}
          className="relative w-full h-full rounded-full bg-surface-container/40 backdrop-blur-xl border-2 border-secondary/20 qibla-glow flex items-center justify-center compass-ring shadow-2xl"
        >
          {/* Geometric Islamic Pattern */}
          <div className="absolute inset-4 opacity-10 pointer-events-none">
            <svg className="w-full h-full fill-secondary" viewBox="0 0 100 100">
              <path d="M50 0L61.2 38.8L100 50L61.2 61.2L50 100L38.8 61.2L0 50L38.8 38.8Z" />
              <circle cx="50" cy="50" fill="none" r="15" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Degree Markings */}
          <div className="absolute inset-2 pointer-events-none">
            <div className="w-full h-full relative font-label-caps text-[10px] text-on-surface-variant/40">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-secondary font-bold">
                N
              </span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2">E</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2">S</span>
              <span className="absolute left-0 top-1/2 -translate-y-1/2">W</span>
            </div>
          </div>

          {/* Qibla Arrow */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${qiblaBearing}deg)` }}
          >
            <div className="relative w-1 h-3/4 flex flex-col items-center">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center -mt-4 shadow-lg shadow-secondary/20 animate-pulse-gold">
                <span
                  className="material-symbols-outlined text-on-secondary text-xl material-symbols-filled"
                >
                  explore
                </span>
              </div>
              <div className="w-1 flex-1 bg-gradient-to-b from-secondary to-transparent opacity-50" />
            </div>
          </div>

          {/* Center Hub */}
          <div className="z-20 w-16 h-16 rounded-full bg-primary-container border border-secondary/30 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-secondary text-2xl material-symbols-filled">
              location_on
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Display */}
      <div className="z-10 grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="bg-surface-container/40 backdrop-blur-xl p-6 rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">
            {tr.qiblaAngle}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display-lg text-headline-lg text-secondary">
              {formatBearing(qiblaBearing)}
            </span>
            <span className="font-title-md text-title-md text-secondary">° {cardinal}</span>
          </div>
        </div>
        <div className="bg-surface-container/40 backdrop-blur-xl p-6 rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center">
          <span className="font-label-caps text-label-caps text-on-surface-variant mb-2">
            {tr.distanceLabel}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-display-lg text-headline-lg text-secondary">
              {formatDistance(distance)}
            </span>
            <span className="font-label-caps text-label-caps text-secondary">{tr.kmUnit}</span>
          </div>
        </div>
      </div>

      {/* Action Card */}
      <div className="z-10 mt-8 w-full max-w-sm bg-primary-container/30 border border-secondary/10 p-5 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-secondary">info</span>
        </div>
        <div>
          <h3 className="font-title-md text-title-md text-on-surface">{tr.precisionAlignment}</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            {tr.precisionAlignmentDesc}
          </p>
        </div>
      </div>
    </>
  );
}
