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
}

export function Sidebar({ items, title }: SidebarProps) {
  const pathname = usePathname();
  const { tr } = useLang();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-outline/20 bg-surface min-h-screen">
      <div className="p-6 border-b border-outline/20">
        <h1 className="font-headline text-xl text-gold">{tr.appName}</h1>
        <p className="font-arabic text-gold-light text-sm mt-0.5">{tr.appNameAr}</p>
        <p className="text-on-surface-variant text-xs mt-2">{title}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
      <div className="p-4 border-t border-outline/20">
        <Link href="/" className="text-sm text-on-surface-variant hover:text-gold flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          App
        </Link>
      </div>
    </aside>
  );
}
