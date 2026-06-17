'use client';

import type { Lang } from '@/types';
import { useLang } from '@/components/providers/LangProvider';
import { cn } from '@/lib/utils';

const LANGS: Lang[] = ['de', 'ar', 'en'];

export function MobileHeaderLangSwitcher() {
  const { lang, setLang } = useLang();

  return (
    <div className="flex items-center gap-3">
      {LANGS.map((code, index) => (
        <span key={code} className="flex items-center gap-3">
          {index > 0 && <div className="w-px h-4 bg-outline-variant" />}
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
  );
}
