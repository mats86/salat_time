'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#131313] text-[#e5e2e1] flex flex-col items-center justify-center px-6 text-center gap-4 font-sans">
        <h1 className="text-2xl text-[#e9c349]">Salat Zeit</h1>
        <p className="text-sm opacity-80">{error.message || 'Something went wrong.'}</p>
        <button
          type="button"
          onClick={reset}
          className="bg-[#e9c349] text-[#3c2f00] px-6 py-3 rounded-full font-semibold"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
