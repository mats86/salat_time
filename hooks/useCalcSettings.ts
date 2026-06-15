'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getCalcSettings,
  getDefaultCalcSettings,
  type CalcSettings,
} from '@/lib/calc-settings';

export function useCalcSettings() {
  const [settings, setSettings] = useState<CalcSettings>(() =>
    typeof window !== 'undefined' ? getCalcSettings() : getDefaultCalcSettings()
  );

  const refresh = useCallback(() => {
    setSettings(getCalcSettings());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('calc-settings-changed', handler);
    return () => window.removeEventListener('calc-settings-changed', handler);
  }, [refresh]);

  return { settings, refresh };
}
