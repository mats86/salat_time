'use client';

import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName } from '@/lib/i18n';

const langCycle: Lang[] = ['de', 'en', 'ar'];

export function CalendarHeader() {
  const { lang, setLang } = useLang();
  const brandName = getAppBrandName(lang);

  const cycleLang = () => {
    const idx = langCycle.indexOf(lang);
    setLang(langCycle[(idx + 1) % langCycle.length]);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-background/40 backdrop-blur-md flex items-center justify-between px-margin-mobile py-stack-md">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">mosque</span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
          {brandName}
        </h1>
      </div>
      <button
        type="button"
        onClick={cycleLang}
        className="font-label-caps text-label-caps text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200"
      >
        {lang.toUpperCase()}
      </button>
    </header>
  );
}
