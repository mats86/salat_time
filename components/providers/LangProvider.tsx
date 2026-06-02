'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Lang } from '@/types';
import { t, getStoredLanguage, setDocumentLanguage } from '@/lib/i18n';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: ReturnType<typeof t>;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('de');

  useEffect(() => {
    setLangState(getStoredLanguage());
  }, []);

  useEffect(() => {
    setDocumentLanguage(lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setDocumentLanguage(l);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, tr: t(lang) }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
