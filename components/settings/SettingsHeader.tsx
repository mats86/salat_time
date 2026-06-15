'use client';

import { useRouter } from 'next/navigation';
import { useLang } from '@/components/providers/LangProvider';

export function SettingsHeader() {
  const router = useRouter();
  const { tr } = useLang();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-lg flex items-center px-margin-mobile h-16">
      <button
        type="button"
        onClick={() => router.back()}
        className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200 mr-4"
        aria-label={tr.back}
      >
        arrow_back
      </button>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
        {tr.settings}
      </h1>
    </header>
  );
}
