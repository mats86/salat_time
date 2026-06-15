'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center px-margin-mobile text-center gap-4">
      <span className="material-symbols-outlined text-secondary text-5xl">error</span>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
        Fehler
      </h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
        {error.message || 'Etwas ist schiefgelaufen.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-title-md hover:brightness-110 transition-all"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
