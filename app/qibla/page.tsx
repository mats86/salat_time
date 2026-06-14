'use client';

import { QiblaHeader } from '@/components/qibla/QiblaHeader';
import { QiblaCompass } from '@/components/qibla/QiblaCompass';
import { QiblaDesktop } from '@/components/qibla/QiblaDesktop';
import { BottomNav } from '@/components/layout/BottomNav';
import { LocationSheet } from '@/components/location/LocationSheet';
import { Spinner } from '@/components/ui/Spinner';
import { useLang } from '@/components/providers/LangProvider';
import { getLocationErrorMessage } from '@/lib/i18n';
import { useLocation } from '@/hooks/useLocation';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { useState, useEffect } from 'react';

export default function QiblaPage() {
  const { tr } = useLang();
  const {
    coords,
    loading: locLoading,
    error: locError,
    permissionDenied,
    detect,
    setManualLocation,
  } = useLocation();
  const { countdown, nextPrayer } = usePrayerTimes(coords?.lat, coords?.lng);
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    if (permissionDenied && !coords) {
      setLocationOpen(true);
    }
  }, [permissionDenied, coords]);

  const locationError = getLocationErrorMessage(tr, locError);

  return (
    <>
      {/* Desktop */}
      {coords && (
        <QiblaDesktop
          lat={coords.lat}
          lng={coords.lng}
          locationLabel={coords.label}
          nextPrayer={nextPrayer}
          countdown={countdown}
        />
      )}
      {!coords && locLoading && (
        <div className="hidden md:flex min-h-screen items-center justify-center bg-background">
          <Spinner />
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden bg-background text-on-background font-body-lg min-h-screen selection:bg-secondary/30">
      <QiblaHeader />

      <main className="relative min-h-screen pt-24 pb-32 flex flex-col items-center px-margin-mobile qibla-geometric-bg overflow-hidden">
        {/* Background Decor */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-container rounded-full blur-[120px]" />
        </div>

        {locationError && !locLoading && (
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="z-10 mb-4 font-body-sm text-body-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3 w-full max-w-sm text-center"
          >
            {locationError}
          </button>
        )}

        {locLoading && !coords && (
          <div className="z-10 flex flex-col items-center justify-center py-24 gap-3">
            <Spinner />
            <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.locating}</p>
          </div>
        )}

        {coords && <QiblaCompass lat={coords.lat} lng={coords.lng} />}
      </main>

      <BottomNav />

      <LocationSheet
        open={locationOpen}
        onClose={() => setLocationOpen(false)}
        onUseGps={detect}
        onSelectPlace={(place) => setManualLocation(place.lat, place.lng, place.label)}
        loadingGps={locLoading}
        currentLabel={coords?.label}
      />
      </div>
    </>
  );
}
