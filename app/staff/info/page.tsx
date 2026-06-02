'use client';

import { useLang } from '@/components/providers/LangProvider';
import { MosqueForm } from '@/components/forms/MosqueForm';
import directus, { createItem } from '@/lib/directus';
import type { Mosque } from '@/types';

const DEMO_MOSQUE: Partial<Mosque> = {
  name: 'Al-Noor Mosque',
  city: 'Berlin',
  address: 'Wedding, Berlin',
  opening_hours: 'Daily 5:00 - 22:00',
  has_women_area: true,
  has_parking: true,
  has_wudu: true,
};

export default function StaffInfoPage() {
  const { tr } = useLang();

  const handleSubmit = async (data: Partial<Mosque>) => {
    await directus.request(
      createItem('change_requests', {
        type: 'mosque_info',
        status: 'pending',
        mosque_id: '7df677b5-43da-4c80-a9d3-e003dc41254a',
        payload: data,
      })
    );
    alert('Info change request submitted');
  };

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-headline text-2xl text-gold">{tr.mosqueInfo}</h1>
      <MosqueForm mosque={DEMO_MOSQUE} onSubmit={handleSubmit} />
    </div>
  );
}
