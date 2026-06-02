'use client';

import { useLang } from '@/components/providers/LangProvider';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AdminSettingsPage() {
  const { tr } = useLang();

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.settings}</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="text-sm text-on-surface-variant block mb-1">
            Aladhan calculation method
          </label>
          <Input defaultValue="3" type="number" />
          <p className="text-xs text-on-surface-variant mt-1">3 = Muslim World League</p>
        </div>
        <div>
          <label className="text-sm text-on-surface-variant block mb-1">Google Maps API Key</label>
          <Input placeholder="Set in .env.local" disabled />
        </div>
        <div>
          <label className="text-sm text-on-surface-variant block mb-1">App name (DE)</label>
          <Input defaultValue="Salat Zeit" />
        </div>
        <Button>Save</Button>
      </Card>
    </div>
  );
}
