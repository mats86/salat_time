'use client';

import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName } from '@/lib/i18n';

export function HomeHeader() {
  const { lang } = useLang();
  const brandName = getAppBrandName(lang);

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-surface/40 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">mosque</span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight font-arabic">
          {brandName}
        </h1>
      </div>
    </header>
  );
}
