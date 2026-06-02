'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MosqueForm } from '@/components/forms/MosqueForm';
import directus, { readItem, updateItem } from '@/lib/directus';
import type { Mosque } from '@/types';

export default function AdminMosqueEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [mosque, setMosque] = useState<Mosque | null>(null);

  useEffect(() => {
    directus.request(readItem('mosques', id)).then(setMosque).catch(() => setMosque(null));
  }, [id]);

  const handleSubmit = async (data: Partial<Mosque>) => {
    await directus.request(updateItem('mosques', id, data));
    alert('Saved');
  };

  if (!mosque) return <p className="text-on-surface-variant">Loading…</p>;

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="font-headline text-2xl text-gold">Edit Mosque</h1>
      <MosqueForm mosque={mosque} onSubmit={handleSubmit} />
    </div>
  );
}
