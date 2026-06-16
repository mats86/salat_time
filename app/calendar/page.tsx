'use client';

import { CalendarDesktop } from '@/components/calendar/CalendarDesktop';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarMobile } from '@/components/calendar/CalendarMobile';
import { BottomNav } from '@/components/layout/BottomNav';
import { LocationSheet } from '@/components/location/LocationSheet';
import { Spinner } from '@/components/ui/Spinner';
import { useLang } from '@/components/providers/LangProvider';
import { getLocationErrorMessage } from '@/lib/i18n';
import { useLocation } from '@/hooks/useLocation';
import { useState, useEffect } from 'react';

export default function CalendarPage() {
  const { tr } = useLang();
  const {
    coords,
    loading: locLoading,
    error: locError,
    permissionDenied,
    detect,
    setManualLocation,
  } = useLocation();
  const [locationOpen, setLocationOpen] = useState(false);

  useEffect(() => {
    if (permissionDenied && !coords) {
      setLocationOpen(true);
    }
  }, [permissionDenied, coords]);

  const locationError = getLocationErrorMessage(tr, locError);

  return (
    <>
      {coords && (
        <CalendarDesktop
          lat={coords.lat}
          lng={coords.lng}
          locationLabel={coords.label}
        />
      )}

      {!coords && locLoading && (
        <div className="hidden md:flex min-h-screen items-center justify-center bg-background">
          <Spinner />
        </div>
      )}

      <div className="md:hidden bg-background text-on-background font-body-lg min-h-screen selection:bg-secondary/30 overflow-x-hidden">
        <CalendarHeader />

        {locationError && !locLoading && (
          <div className="pt-24 px-margin-mobile">
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="font-body-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3 w-full text-center"
            >
              {locationError}
            </button>
          </div>
        )}

        {locLoading && !coords && (
          <div className="flex flex-col items-center justify-center min-h-screen gap-3">
            <Spinner />
            <p className="font-body-sm text-on-surface-variant">{tr.locating}</p>
          </div>
        )}

        {coords && (
          <CalendarMobile
            lat={coords.lat}
            lng={coords.lng}
            locationLabel={coords.label}
          />
        )}

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
