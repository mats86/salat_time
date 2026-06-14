'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { tr } = useLang();
  const [hash, setHash] = useState('');

  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, [pathname]);

  const items = [
    {
      href: '/',
      icon: 'schedule',
      label: tr.navPrayer,
      active: pathname === '/' && hash !== '#mosques',
    },
    {
      href: '/#mosques',
      icon: 'home_pin',
      label: tr.mosques,
      active: pathname === '/' && hash === '#mosques',
    },
    {
      href: '/qibla',
      icon: 'explore',
      label: tr.qibla,
      active: pathname === '/qibla',
    },
    {
      href: '/auth/login',
      icon: 'settings',
      label: tr.settings,
      active: pathname.startsWith('/auth'),
    },
  ];
  return (
    <nav className="fixed bottom-0 w-full z-50 bg-surface-container/40 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-4px_10px_rgba(212,175,55,0.1)] rounded-t-xl">
      <div className="flex justify-around items-center w-full px-2 pb-6 pt-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center font-label-caps text-label-caps transition-all active:scale-90 duration-150 p-2',
              item.active
                ? 'text-secondary bg-primary-container/20 rounded-xl'
                : 'text-on-surface-variant hover:text-primary-fixed-dim'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined',
                item.active && item.icon === 'explore' && 'material-symbols-filled'
              )}
            >
              {item.icon}
            </span>
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
