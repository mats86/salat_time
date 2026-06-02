import { Suspense } from 'react';
import { Spinner } from '@/components/ui/Spinner';

export default function CallbackLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner /></div>}>{children}</Suspense>;
}
