'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLang } from '@/components/providers/LangProvider';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

interface SidebarProps {
  items: NavItem[];
  title: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ items, title, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { tr } = useLang();

  const header = (
    <div className="p-6 border-b border-outline/20">
      <h1 className="font-headline text-xl text-gold">{tr.appName}</h1>
      <p className="font-arabic text-gold-light text-sm mt-0.5">{tr.appNameAr}</p>
      <p className="text-on-surface-variant text-xs mt-2">{title}</p>
    </div>
  );

  const nav = (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onMobileClose}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-stitch text-sm transition',
            pathname === item.href || pathname.startsWith(item.href + '/')
              ? 'bg-primary-container text-gold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-pale'
          )}
        >
          <span className="material-symbols-outlined text-xl">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="p-4 border-t border-outline/20">
      <Link
        href="/"
        onClick={onMobileClose}
        className="text-sm text-on-surface-variant hover:text-gold flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        App
      </Link>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 flex-col border-r border-outline/20 bg-surface min-h-screen">
        {header}
        {nav}
        {footer}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
            aria-label={tr.closeMenu}
          />
          <aside className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-end border-b border-outline/20 p-3">
              <button
                type="button"
                onClick={onMobileClose}
                className="p-2 text-on-surface-variant hover:text-gold"
                aria-label={tr.closeMenu}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {header}
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
