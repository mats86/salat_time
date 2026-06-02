'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLang } from '@/components/providers/LangProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { LangSwitcher } from '@/components/layout/LangSwitcher';
import { Spinner } from '@/components/ui/Spinner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const { tr } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user && !isAdmin) router.replace('/auth/login?error=admin_only');
  }, [loading, user, isAdmin, router]);

  const navItems = [
    { href: '/admin', icon: 'dashboard', label: tr.overview },
    { href: '/admin/mosques', icon: 'mosque', label: tr.mosques },
    { href: '/admin/staff', icon: 'group', label: tr.staff },
    { href: '/admin/requests', icon: 'pending_actions', label: tr.requests },
    { href: '/admin/settings', icon: 'settings', label: tr.settings },
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
      <Sidebar items={navItems} title={tr.adminDashboard} />
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
