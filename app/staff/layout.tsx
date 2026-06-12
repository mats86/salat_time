'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffTopBar } from '@/components/staff/StaffTopBar';
import { StaffMobileNav } from '@/components/staff/StaffMobileNav';
import { Spinner } from '@/components/ui/Spinner';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-primary-container md:bg-background text-on-surface font-body-lg min-h-screen overflow-x-hidden">
      <StaffSidebar />
      <StaffTopBar />
      <main className="md:ml-64 mt-20 md:mt-0 pt-0 md:pt-8 px-margin-mobile md:px-10 pb-32">
        {children}
      </main>
      <StaffMobileNav />
    </div>
  );
}
