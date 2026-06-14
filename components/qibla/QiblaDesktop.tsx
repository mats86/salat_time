'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName, getPrayerLabel } from '@/lib/i18n';
import { formatCountdownShort } from '@/lib/utils';
import {
  calculateQiblaBearing,
  calculateDistanceToMecca,
  bearingToCardinal,
  formatBearing,
  formatDistance,
} from '@/lib/qibla';
import { useCompass } from '@/hooks/useCompass';
import type { Lang, PrayerName } from '@/types';

const KAABA_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCtKdoUSfdv3JKgWAGU38AY8T5nfuWNxDod8KwJF7R3tOft7Dc_zosVUG7lGKtz1cxgvuJdefDkaMwyRpi9AddlTt4Vf2YDQ8Oj3cc8x6c6wrHRT83_IXsrxhsPCot-EaazXvsd_3MxCRMWaoOa55w5_FAjj7nJKXhaJYSG9saeJF7DfYMRhJlt-K6pTm3lO3G5nsmEIsA57FwxrTyWJ9X8RiShhADgEEbAaIbivSuT0OuFV2AyUQusKGsmBuD5pvLt_3MPPsXcifzT';

const PROFILE_PLACEHOLDER =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDdkN3bZBMz6m75oT2MwO3uuwYrCr3SBet6b2DK7xoq6lTnMd1xN1oSRNh__ST0j3OupBY6tGFjQaSfvxy7M-SBFt9J4LlJAq5m9y5NubkThuTm0SptCNWriru4pc5rCPSLCKVTYA2OHj8vkgTrkWHc1AEfgWlb0MyrMafYWC8-wFU4k5HWK0LS8hrJpBBihXk625BWyXRjZAJMsUxI8aTp7d6CshT4Ip9Ba_OswoT8QZ2h2Eqwm3xQuooXUjMPQTrqY3B4Y9Dl5SKM';

const langs: Lang[] = ['de', 'ar', 'en'];

interface QiblaDesktopProps {
  lat: number;
  lng: number;
  locationLabel?: string;
  nextPrayer: { name: PrayerName; time: string } | null;
  countdown: string;
}

export function QiblaDesktop({
  lat,
  lng,
  locationLabel,
  nextPrayer,
  countdown,
}: QiblaDesktopProps) {
  const { lang, setLang, tr } = useLang();
  const brandName = getAppBrandName(lang);
  const needleRef = useRef<HTMLDivElement>(null);
  const { heading, calibrated } = useCompass();

  const qiblaBearing = calculateQiblaBearing(lat, lng);
  const distance = calculateDistanceToMecca(lat, lng);
  const cardinal = bearingToCardinal(qiblaBearing);

  const baseRotation = heading != null ? qiblaBearing - heading : qiblaBearing;
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const animFrameRef = useRef<number>(0);
  const baseRotationRef = useRef(baseRotation);

  baseRotationRef.current = baseRotation;

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  const countdownParts = countdown.split(':').map(Number);
  let countdownShort = countdown;
  if (countdownParts.length === 3) {
    const [h, m, s] = countdownParts;
    countdownShort = formatCountdownShort(h * 3600 + m * 60 + s);
  }

  const startJitter = useCallback(() => {
    const needle = needleRef.current;
    if (!needle) return;

    const simulate = () => {
      const jitter = (Math.random() - 0.5) * 0.4;
      needle.style.transform = `rotate(${baseRotationRef.current + jitter}deg)`;
      animFrameRef.current = requestAnimationFrame(simulate);
    };

    animFrameRef.current = requestAnimationFrame(simulate);
  }, []);

  useEffect(() => {
    const needle = needleRef.current;
    if (!needle || isRecalibrating) return;

    needle.style.transform = `rotate(${baseRotation}deg)`;

    const timeout = setTimeout(startJitter, 2000);
    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRecalibrating, baseRotation, startJitter]);

  const handleRecalibrate = () => {
    const needle = needleRef.current;
    if (!needle) return;

    cancelAnimationFrame(animFrameRef.current);
    setIsRecalibrating(true);

    needle.style.transition = 'transform 3s cubic-bezier(0.19, 1, 0.22, 1)';
    needle.style.transform = `rotate(${baseRotationRef.current + 360 * 3}deg)`;

    setTimeout(() => {
      needle.style.transition = 'transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      needle.style.transform = `rotate(${baseRotationRef.current}deg)`;

      setTimeout(() => {
        needle.style.transition = '';
        setIsRecalibrating(false);
        startJitter();
      }, 1600);
    }, 3200);
  };

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=21.4225,39.8262`;

  return (
    <div className="hidden md:flex flex-col min-h-screen qibla-desktop-pattern bg-background text-on-background font-body-lg">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-lg shadow-sm bg-surface-container-low/40 border-b border-outline-variant/20">
        <div className="flex justify-between items-center h-20 px-margin-desktop max-w-[1200px] mx-auto">
          <Link href="/" className="font-headline-lg text-headline-lg text-secondary">
            {brandName}
          </Link>
          <nav className="hidden md:flex items-center gap-stack-lg">
            <Link
              href="/"
              className="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors active:scale-95 duration-150"
            >
              {tr.navPrayerTimes}
            </Link>
            <Link
              href="/#mosques"
              className="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors active:scale-95 duration-150"
            >
              {tr.mosques}
            </Link>
            <Link
              href="/qibla"
              className="font-body-lg text-body-lg text-secondary border-b-2 border-secondary font-bold pb-1 active:scale-95 duration-150"
            >
              {tr.qibla}
            </Link>
            <Link
              href="/auth/login"
              className="font-body-lg text-body-lg text-on-surface-variant hover:text-on-surface transition-colors active:scale-95 duration-150"
            >
              {tr.navCommunity}
            </Link>
          </nav>
          <div className="flex items-center gap-stack-md">
            <button
              type="button"
              onClick={cycleLang}
              className="material-symbols-outlined text-primary hover:bg-surface-bright/10 p-2 rounded-full transition-all active:scale-95 duration-150"
              aria-label="Language"
            >
              language
            </button>
            <button
              type="button"
              className="material-symbols-outlined text-primary hover:bg-surface-bright/10 p-2 rounded-full transition-all active:scale-95 duration-150"
              aria-label="Notifications"
            >
              notifications
            </button>
            <Image
              src={PROFILE_PLACEHOLDER}
              alt=""
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border-2 border-secondary/20 object-cover"
            />
          </div>
        </div>
      </header>

      <main className="flex-grow pt-32 pb-stack-lg px-margin-desktop max-w-[1200px] mx-auto w-full">
        {/* Context Bar */}
        <div className="mb-stack-lg flex justify-between items-end border-b border-outline-variant/10 pb-stack-sm">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
              {tr.qiblaDirectionTitle}
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {locationLabel ?? '—'} •{' '}
              <span className="text-secondary font-bold">
                {calibrated ? tr.gpsCalibrated : tr.calibratingCompass}
              </span>
            </p>
          </div>
          {nextPrayer && (
            <div className="text-right glass-panel px-4 py-2 rounded-lg border-secondary/30">
              <p className="font-label-caps text-label-caps text-secondary">{tr.nextPrayerCaps}</p>
              <p className="font-headline-lg text-headline-lg text-on-surface">
                {getPrayerLabel(lang, nextPrayer.name)}{' '}
                <span className="text-primary/60 text-title-md">
                  {tr.in} {countdownShort}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-gutter items-start">
          {/* Left Stats Cluster */}
          <div className="col-span-12 lg:col-span-3 space-y-gutter">
            <div className="glass-panel p-stack-md rounded-xl group hover:border-secondary/50 transition-all">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                {tr.qiblaAngleCaps}
              </p>
              <p className="font-display-lg text-display-lg text-secondary">
                {formatBearing(qiblaBearing)}° {cardinal}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant/70 mt-1">
                {tr.relativeToTrueNorth}
              </p>
            </div>
            <div className="glass-panel p-stack-md rounded-xl group hover:border-secondary/50 transition-all">
              <p className="font-label-caps text-label-caps text-on-surface-variant mb-2">
                {tr.distanceCaps}
              </p>
              <p className="font-display-lg text-display-lg text-secondary">
                {formatDistance(distance)} {tr.kmUnit}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant/70 mt-1">
                {tr.distanceToKaaba}
              </p>
            </div>
            <div className="glass-panel p-stack-md rounded-xl bg-primary-container/20">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary">verified_user</span>
                <div>
                  <p className="font-title-md text-title-md text-primary mb-1">{tr.highAccuracy}</p>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    {tr.highAccuracyDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Central Hero: The Compass */}
          <div className="col-span-12 lg:col-span-6 flex flex-col items-center justify-center p-stack-lg relative min-h-[500px]">
            <div className="relative w-full aspect-square max-w-[440px] flex items-center justify-center">
              {/* Outer Decorative Ring */}
              <div className="absolute inset-0 rounded-full border-4 border-secondary/10 compass-glow" />
              <div className="absolute inset-4 rounded-full border border-secondary/20 border-dashed animate-[spin_60s_linear_infinite]" />

              {/* Main Compass Body */}
              <div className="relative w-[85%] aspect-square rounded-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest shadow-2xl border-2 border-outline-variant/30 flex items-center justify-center">
                {/* Geometric Background */}
                <div className="absolute inset-0 opacity-10 rounded-full overflow-hidden">
                  <div className="w-full h-full qibla-compass-pattern" />
                </div>

                {/* Degree Markers */}
                <div className="absolute inset-0 rounded-full">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 font-label-caps text-secondary">
                    N
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-label-caps text-on-surface-variant">
                    S
                  </div>
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 font-label-caps text-on-surface-variant">
                    W
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 font-label-caps text-on-surface-variant">
                    E
                  </div>
                </div>

                {/* Rotating Needle Group */}
                <div
                  ref={needleRef}
                  className="absolute w-full h-full needle-transition flex items-center justify-center"
                  style={{ transform: `rotate(${baseRotation}deg)` }}
                >
                  <div className="relative h-[80%] w-[4px] bg-gradient-to-b from-secondary via-secondary to-transparent rounded-full">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      <span className="material-symbols-outlined text-secondary text-[40px] material-symbols-filled">
                        mosque
                      </span>
                      <div className="h-4 w-[2px] bg-secondary mt-1" />
                    </div>
                  </div>
                </div>

                {/* Center Pivot */}
                <div className="relative z-10 w-8 h-8 rounded-full bg-secondary border-4 border-surface shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-surface" />
                </div>
              </div>
            </div>

            <div className="mt-stack-lg text-center">
              <button
                type="button"
                onClick={handleRecalibrate}
                className="bg-secondary text-on-secondary px-stack-lg py-3 rounded-full font-title-md hover:brightness-110 active:scale-95 transition-all shadow-lg inline-flex items-center gap-3"
              >
                <span className="material-symbols-outlined">explore</span>
                {tr.recalibrateCompass}
              </button>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-4 italic opacity-70">
                {tr.pointDeviceHorizon}
              </p>
            </div>
          </div>

          {/* Right Sidebar: Precision Tips */}
          <aside className="col-span-12 lg:col-span-3 space-y-gutter">
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="bg-secondary/10 p-4 border-b border-secondary/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-sm">info</span>
                <h2 className="font-title-md text-title-md text-secondary">{tr.precisionTips}</h2>
              </div>
              <div className="p-stack-md space-y-4">
                <div className="flex gap-3">
                  <span className="text-secondary font-bold">01</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {tr.precisionTip1}
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary font-bold">02</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {tr.precisionTip2}
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-secondary font-bold">03</span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {tr.precisionTip3}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group cursor-pointer overflow-hidden rounded-xl h-48">
              <Image
                src={KAABA_IMAGE}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="300px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                <p className="font-label-caps text-label-caps text-secondary mb-1">
                  {tr.traditionCaps}
                </p>
                <h3 className="font-title-md text-title-md text-white">{tr.whyFaceQibla}</h3>
                <span className="material-symbols-outlined text-white/50 text-sm mt-1">
                  arrow_forward
                </span>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-panel p-stack-md rounded-xl flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-bright flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">map</span>
                </div>
                <div>
                  <p className="font-title-md text-title-md text-on-surface">{tr.viewOnMap}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {tr.viewOnMapSub}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">
                chevron_right
              </span>
            </a>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto bg-surface-container-lowest border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-center py-stack-lg px-margin-desktop max-w-[1200px] mx-auto gap-gutter">
          <div className="font-headline-lg text-headline-lg text-secondary">{brandName}</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant/70 text-center md:text-left">
            {tr.footerCopyright}
          </p>
          <div className="flex gap-stack-md">
            <a
              href="#"
              className="font-body-sm text-body-sm text-on-surface-variant/70 hover:text-primary transition-colors cursor-pointer"
            >
              {tr.privacyPolicy}
            </a>
            <a
              href="#"
              className="font-body-sm text-body-sm text-on-surface-variant/70 hover:text-primary transition-colors cursor-pointer"
            >
              {tr.termsOfService}
            </a>
            <a
              href="#"
              className="font-body-sm text-body-sm text-on-surface-variant/70 hover:text-primary transition-colors cursor-pointer"
            >
              {tr.contactUs}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
