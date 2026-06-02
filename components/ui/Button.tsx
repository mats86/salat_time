import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition rounded-stitch disabled:opacity-50',
        variant === 'primary' && 'bg-gold text-deep hover:bg-gold-light',
        variant === 'secondary' && 'bg-primary-container text-pale border border-outline/30 hover:bg-moss',
        variant === 'ghost' && 'text-on-surface hover:bg-surface-variant',
        variant === 'danger' && 'bg-error/20 text-error border border-error/30',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
