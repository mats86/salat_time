'use client';

import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';

const langCycle: Lang[] = ['de', 'en', 'ar'];

export function QiblaHeader() {
  const { lang, setLang, tr } = useLang();

  const cycleLang = () => {
    const idx = langCycle.indexOf(lang);
    setLang(langCycle[(idx + 1) % langCycle.length]);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/20 flex justify-between items-center px-margin-mobile py-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary font-headline-lg-mobile text-headline-lg-mobile">
          mosque
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          {tr.qiblaFinder}
        </h1>
      </div>
      <button
        type="button"
        onClick={cycleLang}
        className="text-primary font-label-caps text-label-caps px-3 py-1 rounded-full border border-primary/20 active:scale-95 duration-200"
      >
        {lang.toUpperCase()}
      </button>
    </header>
  );
}
