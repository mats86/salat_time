'use client';

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';

export default function MagicLinkLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Spinner /></div>}>{children}</Suspense>;
}
