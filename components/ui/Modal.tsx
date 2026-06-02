'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg bg-surface border border-outline/30 rounded-stitch p-6 shadow-xl',
          className
        )}
      >
        {title && (
          <h2 className="font-headline text-xl text-pale mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
