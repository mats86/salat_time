import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-stitch px-3 py-2.5 text-pale',
        'placeholder:text-pale/40 focus:border-sage outline-none transition',
        className
      )}
      {...props}
    />
  );
}
