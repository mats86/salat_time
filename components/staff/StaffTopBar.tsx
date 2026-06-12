'use client';

import { useLang } from '@/components/providers/LangProvider';
import type { Lang } from '@/types';

const langs: Lang[] = ['de', 'ar', 'en'];

export function StaffTopBar() {
  const { lang, setLang } = useLang();

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  return (
    <header className="md:hidden fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-surface/40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          mosque
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
          Salat Zeit
        </h1>
      </div>
      <button
        type="button"
        onClick={cycleLang}
        className="bg-surface-container-high px-3 py-1 rounded-full text-label-caps font-label-caps text-secondary hover:text-secondary transition-colors scale-95 active:duration-100"
      >
        {lang.toUpperCase()}
      </button>
    </header>
  );
}
