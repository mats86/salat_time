'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PRAYER_ORDER } from '@/lib/aladhan';
import type { PrayerName } from '@/types';

interface PrayerTimeFormProps {
  locationTimes: Record<PrayerName, string>;
  mosqueTimes?: Partial<Record<PrayerName, string | null>>;
  onSubmit: (payload: Record<string, string | null>) => Promise<void>;
  pending?: boolean;
}

export function PrayerTimeForm({
  locationTimes,
  mosqueTimes = {},
  onSubmit,
  pending,
}: PrayerTimeFormProps) {
  const { tr } = useLang();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [times, setTimes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, string | null> = {};
    for (const name of PRAYER_ORDER) {
      const key = name.toLowerCase();
      if (enabled[name]) {
        payload[key] = times[name] ?? mosqueTimes[name] ?? locationTimes[name];
      } else {
        payload[key] = null;
      }
    }
    await onSubmit(payload);
    setSubmitting(false);
  };

  return (
    <Card className="p-4 space-y-4">
      {pending && (
        <p className="text-gold text-sm bg-gold/10 border border-gold/20 rounded-stitch px-3 py-2">
          {tr.pending}: Change request awaiting approval
        </p>
      )}
      {PRAYER_ORDER.filter((n) => n !== 'Sunrise').map((name) => (
        <div key={name} className="flex items-center gap-4">
          <label className="flex items-center gap-2 flex-1">
            <input
              type="checkbox"
              checked={enabled[name] ?? Boolean(mosqueTimes[name])}
              onChange={(e) => setEnabled((s) => ({ ...s, [name]: e.target.checked }))}
              className="rounded border-outline"
            />
            <span className="text-pale text-sm">{tr.prayers[name]}</span>
          </label>
          {enabled[name] || mosqueTimes[name] ? (
            <input
              type="time"
              defaultValue={mosqueTimes[name] ?? locationTimes[name]}
              onChange={(e) => setTimes((s) => ({ ...s, [name]: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-stitch px-2 py-1 text-pale text-sm"
            />
          ) : (
            <span className="text-on-surface-variant text-xs">{tr.locationTime}</span>
          )}
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={submitting || pending}>
        {tr.submit}
      </Button>
    </Card>
  );
}
