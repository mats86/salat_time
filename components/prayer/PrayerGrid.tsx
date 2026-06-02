'use client';

import { PrayerRow } from './PrayerRow';
import type { MergedPrayerTime } from '@/types';

export function PrayerGrid({ schedule }: { schedule: MergedPrayerTime[] }) {
  return (
    <section className="space-y-stack-md">
      <h3 className="font-label-caps text-label-caps text-on-surface-variant px-1">
        Today&apos;s Schedule
      </h3>
      <div className="space-y-2">
        {schedule.map((p) => (
          <PrayerRow key={p.name} prayer={p} />
        ))}
      </div>
    </section>
  );
}
