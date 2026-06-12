'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDlmwkGipKufo_dcPG1Dr2zxtiMZJsftAc1O332VkIuawIpNsfr68eGj6vYUSvUKMy_liKawaMWPUr-Pae6_QGQf6QD0Py1LL3sxr2xk1ndw4EklzprcG_yl-agzWanESfUnPIPkTliWCGaHuvJmTx3TmbZmQk9ifV-uYdxe_mDnFayPrFiR3YcI1jQTFi00kfKZ8uvEoMOoDd3nY7J-3N5k9y_GDdMxi9ii4W5LyGKgP9B0rcuv7mXvLtR6dqDtVKiBOQkj8ZXEXib';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'Overview', exact: true },
  { href: '/admin/mosques', icon: 'mosque', label: 'Mosques', filledWhenActive: true },
  { href: '/admin/staff', icon: 'group', label: 'Community' },
  { href: '/admin/requests', icon: 'schedule', label: 'Prayer Times' },
  { href: '/admin/settings', icon: 'analytics', label: 'Analytics' },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminMosquesSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-72 bg-primary-container border-r border-outline-variant/30 h-full shrink-0">
      <div className="px-6 py-8">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Salat Zeit</h1>
        <p className="text-on-primary-container font-label-caps opacity-70 mt-1">Admin Dashboard</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300',
                active
                  ? 'bg-secondary-container text-on-secondary-container shadow-lg active:scale-95'
                  : 'text-on-surface-variant hover:bg-surface-variant/30'
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
              <span className="font-title-md text-title-md">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-outline-variant/30">
        <div className="flex items-center gap-4 p-3 bg-surface-container-high/40 rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Admin Profile"
            className="w-10 h-10 rounded-full object-cover"
            src={ADMIN_PORTRAIT}
          />
          <div>
            <p className="font-title-md text-body-sm text-on-surface">Zaid Al-Hariri</p>
            <p className="text-body-sm text-on-surface-variant opacity-70">Head Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
