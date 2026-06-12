'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'DASHBOARD', exact: true },
  { href: '/admin/mosques', icon: 'storefront', label: 'MOSQUES' },
  { href: '/admin/staff', icon: 'group', label: 'STAFF' },
  { href: '/admin/settings', icon: 'settings', label: 'SETTINGS' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-6 pt-2 bg-surface/40 backdrop-blur-md rounded-t-xl shadow-lg">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center px-4 py-2 transition-all',
              active
                ? 'text-secondary bg-secondary-container/20 rounded-xl active:scale-95'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-caps text-[10px] mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
