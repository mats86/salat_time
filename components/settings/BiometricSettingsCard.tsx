'use client';

import { useLang } from '@/components/providers/LangProvider';
import { useAuth } from '@/hooks/useAuth';
import { useBiometric } from '@/hooks/useBiometric';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Spinner } from '@/components/ui/Spinner';

export function BiometricSettingsCard() {
  const { tr } = useLang();
  const { user } = useAuth();
  const { supported, supportReason, enabled, loading, error, enable, disable } = useBiometric(user);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await enable();
    } else {
      disable();
    }
  };

  const unsupportedMessage =
    supportReason === 'webauthn' || supportReason === 'platform'
      ? tr.biometricNotSupported
      : supportReason === 'secure'
        ? tr.biometricSecureContext
        : tr.biometricPwaOnly;

  const statusMessage = !supported
    ? unsupportedMessage
    : error === 'no_refresh_token'
      ? tr.biometricNoRefreshToken
      : error === 'expired'
        ? tr.biometricExpired
        : error === 'failed' || error === 'registration_failed'
          ? tr.biometricFailed
          : enabled
            ? tr.biometricEnabled
            : null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-xl">fingerprint</span>
            <h2 className="font-headline text-lg text-gold">{tr.biometricLogin}</h2>
          </div>
          <p className="text-sm text-on-surface-variant">{tr.biometricDescription}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <Spinner className="w-5 h-5" />}
          <Toggle
            checked={enabled}
            onChange={handleToggle}
            disabled={!supported || loading || !user}
            aria-label={enabled ? tr.biometricDisable : tr.biometricEnable}
          />
        </div>
      </div>

      {!supported && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2">
          {unsupportedMessage}
        </p>
      )}

      {loading && (
        <p className="text-xs text-secondary">{tr.biometricEnabling}</p>
      )}

      {statusMessage && !loading && (
        <p
          className={
            error
              ? 'text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2'
              : 'text-xs text-secondary'
          }
        >
          {statusMessage}
        </p>
      )}
    </Card>
  );
}
