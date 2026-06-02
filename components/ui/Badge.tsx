import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'mint' | 'gold' | 'pending' | 'error';
  className?: string;
}

export function Badge({ children, variant = 'mint', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'text-[11px] px-2 py-0.5 rounded-full font-medium border',
        variant === 'mint' && 'bg-mint/15 text-mint border-mint/25',
        variant === 'gold' && 'bg-gold/15 text-gold border-gold/25',
        variant === 'pending' && 'bg-gold/10 text-gold-light border-gold/20',
        variant === 'error' && 'bg-error/15 text-error border-error/25',
        className
      )}
    >
      {children}
    </span>
  );
}
