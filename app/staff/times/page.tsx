'use client';

import { useLang } from '@/components/providers/LangProvider';
import { PrayerTimeForm } from '@/components/forms/PrayerTimeForm';
import directus, { createItem } from '@/lib/directus';
import type { PrayerName } from '@/types';

const DEMO_TIMES: Record<PrayerName, string> = {
  Fajr: '04:12',
  Sunrise: '06:01',
  Dhuhr: '13:12',
  Asr: '15:42',
  Maghrib: '19:48',
  Isha: '21:22',
};

export default function StaffTimesPage() {
  const { tr } = useLang();

  const handleSubmit = async (payload: Record<string, string | null>) => {
    await directus.request(
      createItem('change_requests', {
        type: 'prayer_times',
        status: 'pending',
        mosque_id: '7df677b5-43da-4c80-a9d3-e003dc41254a',
        payload,
      })
    );
    alert('Change request submitted');
  };

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-headline text-2xl text-gold">{tr.prayerTimes}</h1>
      <PrayerTimeForm locationTimes={DEMO_TIMES} onSubmit={handleSubmit} />
    </div>
  );
}
