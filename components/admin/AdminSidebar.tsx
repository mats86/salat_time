'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ADMIN_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBPwAVWMtdA2E32luM7ph4IUbNRm8YUU8LGnpAVi5fR7b6mn3z32ZaQSgm3a_w1Gye32kejW9an46cF-HTwuvw_48yBy6I_crlakO5csWrN1cRfBWSnf1RoigqFSO7aa34ILdPmfn7Ya-CFfBJrilJpFLigbYOeKIWI5QX7vho9cpVQ4SNDsI_HC9jzzHaB3YtRJiVSTKsscHqz-UrEXUgn1hibSI9LiEhNaVgTJb8ad3IWZl6tZrPKH1f_4t3R4PFQAWaHSV8TJlTY';

const navItems = [
  { href: '/admin', icon: 'dashboard', label: 'Dashboard', exact: true },
  { href: '/admin/mosques', icon: 'storefront', label: 'Mosques' },
  { href: '/admin/staff', icon: 'group', label: 'Staff' },
  { href: '/admin/requests', icon: 'event_note', label: 'Events' },
  { href: '/admin/settings', icon: 'settings', label: 'Settings', separated: true },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex flex-col h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container w-64 z-50">
      <div className="p-6 flex flex-col gap-6">
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Salat Zeit</h1>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-container flex items-center justify-center border border-outline-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Admin Portrait"
              className="w-full h-full object-cover"
              src={ADMIN_PORTRAIT}
            />
          </div>
          <div>
            <p className="font-title-md text-title-md text-on-surface">Salat Zeit Admin</p>
            <p className="text-body-sm text-on-surface-variant">Central Management</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 mx-2 transition-colors',
                  item.separated && 'mt-8',
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
        </div>
      </div>

      <div className="mt-auto p-6 border-t border-outline-variant">
        <p className="text-label-caps font-label-caps text-on-surface-variant opacity-50">V1.0.4</p>
      </div>
    </nav>
  );
}
