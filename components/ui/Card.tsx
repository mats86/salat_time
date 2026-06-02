import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface border border-outline/20 rounded-stitch',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
