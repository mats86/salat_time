'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { BottomNav } from '@/components/layout/BottomNav';
import { RouteMosqueList } from '@/components/route/RouteMosqueList';
import { RouteSearchForm } from '@/components/route/RouteSearchForm';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useLang } from '@/components/providers/LangProvider';
import { useLocation } from '@/hooks/useLocation';
import { useRoutePlanner } from '@/hooks/useRoutePlanner';

const RouteMap = dynamic(
  () => import('@/components/route/RouteMap').then((mod) => mod.RouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-stitch bg-surface border border-outline/20">
        <Spinner />
      </div>
    ),
  }
);

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h} h ${m} min`;
}

export default function RoutePage() {
  const { tr } = useLang();
  const { coords, detect, loading: locLoading } = useLocation();
  const {
    start,
    setStart,
    end,
    setEnd,
    profile,
    setProfile,
    bufferKm,
    setBufferKm,
    status,
    plan,
    error,
    calculate,
    canCalculate,
  } = useRoutePlanner();

  const loading = status === 'loading';
  const showResults = status === 'done' && plan;
  const [pendingStartFromGps, setPendingStartFromGps] = useState(false);

  useEffect(() => {
    if (pendingStartFromGps && coords?.label) {
      setStart({ lat: coords.lat, lng: coords.lng, label: coords.label });
      setPendingStartFromGps(false);
    }
  }, [pendingStartFromGps, coords, setStart]);

  const handleUseMyLocation = () => {
    if (coords?.label) {
      setStart({ lat: coords.lat, lng: coords.lng, label: coords.label });
      return;
    }
    setPendingStartFromGps(true);
    detect();
  };

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen selection:bg-secondary/30 pb-28 md:pb-8">
      <header className="sticky top-0 z-40 bg-surface/40 backdrop-blur-lg border-b border-outline-variant/20 px-margin-mobile md:px-margin-desktop py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-2xl">alt_route</span>
          <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary md:hidden">
            {tr.navRoute}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
          <Card className="p-5 md:p-6 lg:sticky lg:top-24">
            <RouteSearchForm
              start={start}
              end={end}
              onStartChange={setStart}
              onEndChange={setEnd}
              profile={profile}
              onProfileChange={setProfile}
              bufferKm={bufferKm}
              onBufferChange={setBufferKm}
              onCalculate={calculate}
              onUseMyLocation={handleUseMyLocation}
              loading={loading}
              loadingGps={locLoading}
              canCalculate={canCalculate}
            />
          </Card>

          <div className="space-y-6 min-w-0">
            {error && (
              <Card className="p-4 border-error/30 bg-error/10">
                <p className="font-body-sm text-body-sm text-error">{tr.routeError}</p>
              </Card>
            )}

            {!showResults && !loading && (
              <Card className="p-8 text-center hidden md:block">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-3">
                  route
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.routeSubtitle}</p>
              </Card>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Spinner />
                <p className="font-body-sm text-body-sm text-on-surface-variant">{tr.loading}</p>
              </div>
            )}

            {showResults && (
              <>
                <Card className="p-4 flex flex-wrap gap-4">
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{tr.routeDistance}</p>
                    <p className="font-title-md text-title-md text-secondary">
                      {plan.distanceKm.toFixed(1)} km
                    </p>
                  </div>
                  <div>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{tr.routeDuration}</p>
                    <p className="font-title-md text-title-md text-secondary">
                      {formatDuration(plan.durationMin)}
                    </p>
                  </div>
                </Card>

                <div>
                  <h2 className="font-title-md text-title-md text-on-surface mb-3">{tr.routeOnMap}</h2>
                  <Card className="overflow-hidden h-[280px] md:h-[360px] lg:h-[420px]">
                    <RouteMap plan={plan} className="h-full" />
                  </Card>
                </div>

                <div>
                  <h2 className="font-title-md text-title-md text-on-surface mb-3">{tr.routeResults}</h2>
                  <RouteMosqueList mosques={plan.mosques} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
