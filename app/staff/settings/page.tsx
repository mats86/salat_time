'use client';

import { useLang } from '@/components/providers/LangProvider';
import { BiometricSettingsCard } from '@/components/settings/BiometricSettingsCard';

export default function StaffSettingsPage() {
  const { tr } = useLang();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.settings}</h1>
      <section className="space-y-3">
        <h2 className="font-label-caps text-label-caps text-on-surface-variant uppercase">
          {tr.accountSettings}
        </h2>
        <BiometricSettingsCard />
      </section>
    </div>
  );
}
