'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName } from '@/lib/i18n';
import { NavDrawer } from '@/components/layout/NavDrawer';

export function HomeHeader() {
  const { lang, tr } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const brandName = getAppBrandName(lang);

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-margin-mobile h-16 bg-surface/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1 -ml-1 text-primary hover:text-secondary transition-colors active:scale-95"
            aria-label={tr.openMenu}
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-primary">mosque</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight font-arabic">
            {brandName}
          </h1>
        </div>
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
