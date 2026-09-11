'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { getAppBrandName } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const APP_VERSION = '2.4.0-gold';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState('');
  const { lang, tr } = useLang();
  const brandName = getAppBrandName(lang);

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/#mosques') return pathname === '/' && hash === '#mosques';
    if (href === '/auth/login') return pathname.startsWith('/auth');
    return pathname === href;
  };

  const primaryLinks = [
    { href: '/', icon: 'home', label: tr.navHome },
    { href: '/calendar', icon: 'calendar_month', label: tr.navPrayerTimes },
    { href: '/#mosques', icon: 'explore', label: tr.mosques },
    { href: '/route', icon: 'alt_route', label: tr.navRoute },
    { href: '/qibla', icon: 'explore_off', label: tr.qibla },
    { href: '/auth/login', icon: 'groups', label: tr.navCommunity },
  ] as const;

  return (
    <>
      <div
        role="presentation"
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-background/60 backdrop-blur-sm z-[60] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      />

      <aside
        id="nav-drawer"
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 h-full w-72 bg-surface/80 backdrop-blur-md border-r border-outline-variant/20 z-[70] transition-transform duration-300 ease-in-out flex flex-col',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-8 space-y-8 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">mosque</span>
            <h2 className="font-headline-lg text-headline-lg text-primary">{brandName}</h2>
          </div>

          <nav className="flex flex-col gap-4">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl text-on-surface transition-colors',
                  isActive(item.href)
                    ? 'bg-secondary/10 text-secondary'
                    : 'hover:bg-secondary/10'
                )}
              >
                <span className="material-symbols-outlined text-secondary">{item.icon}</span>
                <span className="font-title-md">{item.label}</span>
              </Link>
            ))}

            <div className="h-px bg-outline-variant/20 my-2" />

            <Link
              href="/settings"
              onClick={onClose}
              className={cn(
                'flex items-center gap-4 p-3 rounded-xl text-on-surface transition-colors',
                pathname === '/settings'
                  ? 'bg-secondary/10 text-secondary'
                  : 'hover:bg-secondary/10'
              )}
            >
              <span className="material-symbols-outlined text-secondary">settings</span>
              <span className="font-title-md">{tr.settings}</span>
            </Link>
          </nav>
        </div>

        <div className="p-8">
          <p className="text-label-caps font-label-caps text-on-surface-variant opacity-60">
            {tr.versionLabel} {APP_VERSION}
          </p>
        </div>
      </aside>
    </>
  );
}
