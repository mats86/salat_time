'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/components/providers/LangProvider';
import type { Lang } from '@/types';

const langs: Lang[] = ['de', 'ar', 'en'];

interface AdminTopBarProps {
  title?: string;
}

export function AdminTopBar({ title = 'Administrative Overview' }: AdminTopBarProps) {
  const { lang, setLang, tr } = useLang();
  const { logout } = useAuth();
  const router = useRouter();

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 z-50 md:z-40 bg-surface/40 backdrop-blur-md h-16 flex justify-between items-center px-margin-mobile md:px-margin-desktop">
      <div className="flex items-center gap-3 md:gap-4">
        <span className="material-symbols-outlined text-primary md:hidden">mosque</span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight md:hidden">
          Salat Zeit
        </h1>
        <h2 className="hidden md:block font-title-md text-title-md text-on-surface">{title}</h2>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={cycleLang}
          className="md:hidden bg-surface-container-high px-3 py-1 rounded-full text-label-caps font-label-caps text-on-surface-variant hover:text-secondary transition-colors"
        >
          {lang.toUpperCase()}
        </button>
        <button
          type="button"
          onClick={cycleLang}
          className="hidden md:block text-label-caps font-label-caps text-primary hover:text-secondary transition-colors"
        >
          {lang.toUpperCase()}
        </button>
        <button
          type="button"
          onClick={() => logout().then(() => router.push('/'))}
          className="hidden md:flex items-center gap-2 text-on-surface-variant hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span className="font-label-caps text-label-caps">{tr.logout.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}
