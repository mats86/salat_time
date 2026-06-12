'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMosquesSidebar } from '@/components/admin/AdminMosquesSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMosquesShell = pathname.startsWith('/admin/mosques');

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    }
    if (!loading && user && !isAdmin) router.replace('/auth/login?error=admin_only');
  }, [loading, user, isAdmin, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (isMosquesShell) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background text-on-background font-body-lg">
        <AdminMosquesSidebar />
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">{children}</div>
        <AdminMobileNav />
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background font-body-lg min-h-screen">
      <AdminSidebar />
      <main className="md:ml-64 min-h-screen pb-28 md:pb-12">
        <AdminTopBar />
        <div className="pt-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto antialiased">
          {children}
        </div>
      </main>
      <AdminMobileNav />
    </div>
  );
}
