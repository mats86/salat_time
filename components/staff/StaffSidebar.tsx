'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const STAFF_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAEKAJHvPW7jz2FUy2YCW5iahp4HZQmci4Y5e6x_L9Kzo4ADxSCP91fhOwvuO5lWxx7c-YWznm8P0Kjm_lfqC029GJtmH47WLByujhnlApUNNm4LmY1vY-0B3G4JT4t3urXDGNBKkwUBsMmlLpmuhcf2ZfJXHqf3DvMs55LQT_yjV89ur-poB_62olnm40SYoBXMJQbBTwG918rzy5eIgN-Uf9pG0MhjKUHLE30P3-nR_tXj_-pchX6xZBFSFNtMJ_11O2cqnTJa2HN';

const navItems = [
  { href: '/staff', icon: 'dashboard', label: 'Dashboard', exact: true },
  { href: '/staff/info', icon: 'storefront', label: 'Mosque Profile' },
  { href: '/staff/info', icon: 'group', label: 'Staff' },
  { href: '/staff/events', icon: 'event_note', label: 'Events' },
  { href: '/staff/settings', icon: 'settings', label: 'Settings' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container w-64 z-50">
      <div className="p-6 flex flex-col gap-1">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Salat Zeit</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant opacity-60">ADMIN PORTAL</p>
      </div>

      <nav className="mt-4 flex-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 mx-2 transition-colors',
                active
                  ? 'bg-secondary-container text-on-secondary-container transition-transform'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-body-lg text-body-lg">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Admin Portrait" className="w-full h-full object-cover" src={STAFF_PORTRAIT} />
          </div>
          <div>
            <p className="font-title-md text-title-md text-primary">Salat Zeit Admin</p>
            <p className="text-xs text-on-surface-variant">Central Management</p>
          </div>
        </div>
        <p className="text-[10px] text-center mt-4 opacity-40 font-label-caps">V1.0.4</p>
      </div>
    </aside>
  );
}
