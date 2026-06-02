'use client';

import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { cn } from '@/lib/utils';

const langs: Lang[] = ['de', 'ar', 'en'];

export function HomeHeader() {
  const { lang, setLang } = useLang();

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-surface/40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">mosque</span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
          Salat Zeit
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {langs.map((code, i) => (
          <span key={code} className="flex items-center gap-3">
            {i > 0 && <div className="w-px h-4 bg-outline-variant" />}
            <button
              type="button"
              onClick={() => setLang(code)}
              className={cn(
                'font-label-caps text-label-caps uppercase transition-colors',
                lang === code
                  ? 'text-secondary font-bold'
                  : 'text-on-surface-variant hover:text-secondary'
              )}
            >
              {code.toUpperCase()}
            </button>
          </span>
        ))}
      </div>
    </header>
  );
}
