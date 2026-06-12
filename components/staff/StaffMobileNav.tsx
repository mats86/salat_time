'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/staff', icon: 'schedule', label: 'Prayer', exact: true },
  { href: '/staff/info', icon: 'explore', label: 'Mosques' },
  { href: '/staff', icon: 'explore_off', label: 'Qibla' },
  { href: '/staff/settings', icon: 'settings', label: 'Settings', filledWhenActive: true },
];

function isNavActive(pathname: string, item: (typeof navItems)[number]) {
  if (pathname === '/staff' && item.label === 'Settings') return true;
  if (pathname === '/staff' && item.label === 'Prayer') return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function StaffMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-4 pt-2 bg-surface/40 backdrop-blur-md rounded-t-xl shadow-lg">
      {navItems.map((item) => {
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-1 transition-all',
              active
                ? 'text-secondary bg-secondary-container/20 rounded-xl'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            <span
              className="material-symbols-outlined"
              style={
                active && item.filledWhenActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-label-caps text-label-caps">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
