'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', icon: 'schedule', label: 'Prayer', filled: true },
  { href: '/#mosques', icon: 'explore', label: 'Mosques' },
  { href: '/#qibla', icon: 'explore_off', label: 'Qibla' },
  { href: '/auth/login', icon: 'settings', label: 'Settings' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/40 backdrop-blur-md rounded-t-xl shadow-lg border-t border-outline-variant/10">
      {items.map((item) => {
        const active = pathname === item.href || (item.href === '/' && pathname === '/');
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center font-label-caps text-label-caps mt-1 transition-all active:scale-95 duration-200 ease-in-out px-4 py-1 rounded-xl',
              active
                ? 'text-secondary bg-secondary-container/20'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            <span
              className={cn(
                'material-symbols-outlined',
                active && item.filled && 'material-symbols-filled'
              )}
            >
              {item.icon}
            </span>
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
