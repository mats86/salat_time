'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { cn } from '@/lib/utils';

interface MagicLinkLoginProps {
  email: string;
  onEmailChange: (email: string) => void;
  className?: string;
  variant?: 'mobile' | 'desktop';
}

export function MagicLinkLogin({
  email,
  onEmailChange,
  className,
  variant = 'mobile',
}: MagicLinkLoginProps) {
  const { tr } = useLang();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const buttonClass =
    variant === 'mobile'
      ? 'mt-stack-md w-full h-14 login-glass-mobile rounded-xl flex items-center justify-center gap-3 text-on-surface hover:text-on-surface transition-all border border-outline-variant/20 hover:border-secondary/40 active:scale-[0.98]'
      : 'w-full py-4 rounded-lg flex items-center justify-center gap-3 border border-outline-variant/30 bg-surface/20 hover:border-secondary/40 hover:bg-surface/40 transition-all active:scale-[0.98]';

  const handleRequest = async () => {
    setLoading(true);
    setMagicUrl(null);
    setSent(false);
    try {
      const res = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      setSent(true);
      if (json.url) setMagicUrl(json.url as string);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!magicUrl) return;
    try {
      await navigator.clipboard.writeText(magicUrl);
    } catch {
      /* ignore */
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={cn(buttonClass, className)}>
        <span className="material-symbols-outlined login-mobile-icon">link</span>
        <span className="font-title-md text-title-md">{tr.magicLinkLogin}</span>
      </button>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-2">
        <label className="font-label-caps text-label-caps text-on-surface-variant uppercase text-xs">
          {tr.magicLinkEnterEmail}
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={tr.loginEmailPlaceholder}
          className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-secondary/50"
        />
      </div>

      <button
        type="button"
        onClick={handleRequest}
        disabled={loading || !email.includes('@')}
        className={cn(buttonClass, 'disabled:opacity-60')}
      >
        <span className="material-symbols-outlined login-mobile-icon">send</span>
        <span className="font-title-md text-title-md">
          {loading ? tr.loginAuthenticating : tr.magicLinkSend}
        </span>
      </button>

      {sent && (
        <div className="rounded-xl border border-outline-variant/20 bg-surface-container-low/40 p-4 space-y-2">
          <p className="text-sm text-on-surface-variant">{tr.magicLinkSent}</p>
          {magicUrl && (
            <div className="space-y-2">
              <input
                type="text"
                readOnly
                value={magicUrl}
                className="w-full text-xs bg-background border border-outline-variant/20 rounded-lg px-3 py-2 text-on-surface truncate"
              />
              <button
                type="button"
                onClick={copyLink}
                className="text-sm text-secondary hover:underline"
              >
                {tr.magicLinkCopy}
              </button>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setSent(false);
          setMagicUrl(null);
        }}
        className="text-xs text-on-surface-variant hover:text-secondary"
      >
        {tr.back}
      </button>
    </div>
  );
}
