'use client';

import { useLang } from '@/components/providers/LangProvider';
import type { Lang } from '@/types';
import { cn } from '@/lib/utils';

const langs: { code: Lang; label: string }[] = [
  { code: 'de', label: 'DE' },
  { code: 'ar', label: 'AR' },
  { code: 'en', label: 'EN' },
];

export function LangSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useLang();

  return (
    <div className={cn('flex gap-1 bg-surface-variant rounded-stitch p-0.5', className)}>
      {langs.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-stitch transition',
            lang === l.code ? 'bg-gold text-deep' : 'text-on-surface-variant hover:text-pale'
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
