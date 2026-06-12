'use client';

import { useState, useEffect, useRef } from 'react';
import { HomeHeader } from '@/components/layout/HomeHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { HomeDesktop } from '@/components/home/HomeDesktop';
import { PrayerTimeHero } from '@/components/prayer/PrayerTimeHero';
import { PrayerGrid } from '@/components/prayer/PrayerGrid';
import { MosqueCard } from '@/components/mosque/MosqueCard';
import { LocationSheet } from '@/components/location/LocationSheet';
import { Spinner } from '@/components/ui/Spinner';
import { useLang } from '@/components/providers/LangProvider';
import { getLocationErrorMessage } from '@/lib/i18n';
import { useLocation } from '@/hooks/useLocation';
import { usePrayerAlerts } from '@/hooks/usePrayerAlerts';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useNearbyMosques } from '@/hooks/useNearbyMosques';

export default function HomePage() {
  const { lang, tr } = useLang();
  const {
    coords,
    loading: locLoading,
    error: locError,
    permissionDenied,
    detect,
    setManualLocation,
    source,
  } = useLocation();
  const { timings, hijri, countdown, nextPrayer, schedule, loading: prayerLoading } =
    usePrayerTimes(coords?.lat, coords?.lng);
  const { mosques, loading: mosquesLoading } = useNearbyMosques(coords?.lat, coords?.lng);
  usePrayerAlerts(timings, lang);
  const [locationOpen, setLocationOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loading = locLoading || prayerLoading;

  useEffect(() => {
    if (permissionDenied && !coords) {
      setLocationOpen(true);
    }
  }, [permissionDenied, coords]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || mosques.length === 0) return;
    const t1 = setTimeout(() => {
      el.scrollBy({ left: 40, behavior: 'smooth' });
      const t2 = setTimeout(() => {
        el.scrollBy({ left: -40, behavior: 'smooth' });
      }, 800);
      return () => clearTimeout(t2);
    }, 1000);
    return () => clearTimeout(t1);
  }, [mosques.length]);

  const hijriLabel = hijri
    ? `${hijri.day} ${hijri.month} ${hijri.year} ${tr.hijriSuffix}`
    : `14 Ramadān 1445 ${tr.hijriSuffix}`;

  const locationError = getLocationErrorMessage(tr, locError);

  const locationStatus =
    source === 'gps'
      ? tr.detected
      : source === 'manual'
        ? tr.manual
        : locLoading
          ? tr.locating
          : tr.tapToChange;

  return (
    <>
      {/* Desktop */}
      <HomeDesktop
        coordsLabel={coords?.label}
        hijri={hijri}
        countdown={countdown}
        nextPrayer={nextPrayer}
        schedule={schedule}
        loading={loading}
        mosques={mosques}
        mosquesLoading={mosquesLoading}
        onOpenLocation={() => setLocationOpen(true)}
      />

      {/* Mobile */}
      <div className="md:hidden bg-background text-on-surface font-body-lg min-h-screen pb-32">
        <div className="fixed inset-0 islamic-pattern pointer-events-none" />

        <HomeHeader />

        <main className="pt-24 px-margin-mobile space-y-stack-lg relative z-10 max-w-lg mx-auto">
          <section className="flex justify-between items-end gap-3">
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="space-y-1 text-start flex-1 min-w-0 group"
            >
              <p className="font-label-caps text-label-caps text-tertiary">{hijriLabel}</p>
              <h2 className="font-title-md text-title-md text-on-surface truncate group-hover:text-secondary transition-colors">
                {coords?.label ?? '—'}
              </h2>
              <span className="font-body-sm text-body-sm text-primary/80 group-hover:text-secondary">
                {tr.tapToChange}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="flex flex-col items-end gap-0.5 text-on-surface-variant hover:text-secondary transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-lg">edit_location</span>
              <span className="font-body-sm text-body-sm">{locationStatus}</span>
            </button>
          </section>

          {locationError && !locLoading && (
            <p className="font-body-sm text-body-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
              {locationError}
            </p>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner />
              <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.locating}</p>
            </div>
          )}

          {!loading && nextPrayer && (
            <PrayerTimeHero
              prayerName={nextPrayer.name}
              prayerTime={nextPrayer.time}
              countdown={countdown}
            />
          )}

          {!loading && schedule.length > 0 && <PrayerGrid schedule={schedule} />}

          <section id="mosques" className="space-y-stack-md">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                {tr.mosquesNearYou}
              </h3>
              <button type="button" className="text-primary font-body-sm text-body-sm">
                {tr.viewAll}
              </button>
            </div>
            {mosquesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : mosques.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-8">
                {tr.noMosques}
              </p>
            ) : (
              <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-4 hide-scrollbar -mx-margin-mobile px-margin-mobile"
              >
                {mosques.slice(0, 5).map((m, i) => (
                  <MosqueCard
                    key={m.id}
                    mosque={m}
                    showJummah={i === 0}
                    jamaahTime={i === 0 ? '16:00' : '16:15'}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        <BottomNav />
      </div>

      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onUseGps={detect}
        onSelectPlace={(place) => setManualLocation(place.lat, place.lng, place.label)}
        loadingGps={locLoading}
        currentLabel={coords?.label}
      />
    </>
  );
}
