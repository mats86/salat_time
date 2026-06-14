'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

export function useCompass() {
  const [heading, setHeading] = useState<number | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  const [permissionNeeded, setPermissionNeeded] = useState(false);

  const requestPermission = useCallback(async () => {
    const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        return result === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const DOE = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      setPermissionNeeded(true);
    }

    const handleOrientation = (event: DeviceOrientationEventWithWebkit) => {
      let h: number | null = null;

      if (typeof event.webkitCompassHeading === 'number') {
        h = event.webkitCompassHeading;
      } else if (event.alpha != null) {
        h = 360 - event.alpha;
      }

      if (h != null && !Number.isNaN(h)) {
        setHeading(h);
        setCalibrated(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const enableCompass = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) setPermissionNeeded(false);
    return granted;
  }, [requestPermission]);

  return { heading, calibrated, permissionNeeded, enableCompass };
}
