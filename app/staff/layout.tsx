'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/components/providers/LangProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { Spinner } from '@/components/ui/Spinner';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff, isAdmin, logout } = useAuth();
  const { tr } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    // Allow any authenticated user into /staff by default.
    // Role-specific restrictions can be enforced per action on backend.
  }, [loading, user, isStaff, isAdmin, router]);

  const navItems = [
    { href: '/staff', icon: 'dashboard', label: tr.overview },
    { href: '/staff/times', icon: 'schedule', label: tr.prayerTimes },
    { href: '/staff/events', icon: 'event', label: tr.events },
    { href: '/staff/info', icon: 'mosque', label: tr.mosqueInfo },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navItems} title={tr.staffPortal} />
      <div className="flex-1 flex flex-col">
        <header className="border-b border-outline/20 px-6 py-4 flex justify-between items-center">
          <LangSwitcher />
          <button type="button" onClick={() => logout().then(() => router.push('/'))} className="text-sm text-on-surface-variant hover:text-gold">
            {tr.logout}
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
