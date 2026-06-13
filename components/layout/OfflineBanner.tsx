'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';

interface OfflineBannerProps {
  offline: boolean;
  stale?: boolean;
}

export function OfflineBanner({ offline, stale = false }: OfflineBannerProps) {
  const { tr } = useLang();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!offline) {
      setDismissed(false);
    }
  }, [offline]);

  if ((!offline && !stale) || dismissed) return null;

  const message = stale ? tr.offlinePrayerStale : tr.offlineMode;

  return (
    <div
      role="status"
      className="relative z-20 mx-margin-mobile md:mx-0 md:max-w-7xl md:mx-auto md:px-8 -mt-2 mb-2 md:mt-0 md:mb-4 pointer-events-auto"
    >
      <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high/90 px-4 py-2.5 backdrop-blur-sm">
        <span className="material-symbols-outlined text-sm text-secondary shrink-0">
          {offline ? 'cloud_off' : 'history'}
        </span>
        <p className="font-body-sm text-body-sm text-on-surface-variant flex-1">{message}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label={tr.closeMenu}
          className="material-symbols-outlined text-sm text-on-surface-variant hover:text-on-surface shrink-0"
        >
          close
        </button>
      </div>
    </div>
  );
}
