'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/components/providers/LangProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MosqueForm } from '@/components/forms/MosqueForm';
import { Modal } from '@/components/ui/Modal';
import directus, { readItems, createItem } from '@/lib/directus';
import type { Mosque } from '@/types';

export default function AdminMosquesPage() {
  const { tr } = useLang();
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    directus
      .request(readItems('mosques', { fields: ['*'], limit: 100 }))
      .then(setMosques)
      .catch(() => setMosques([]));
  }, []);

  const filtered = mosques.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.city?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (data: Partial<Mosque>) => {
    await directus.request(createItem('mosques', { ...data, status: 'published' }));
    setModalOpen(false);
    const items = await directus.request(readItems('mosques', { fields: ['*'], limit: 100 }));
    setMosques(items);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="font-headline text-2xl text-gold">{tr.mosques}</h1>
        <Button onClick={() => setModalOpen(true)}>+ New</Button>
      </div>
      <input
        type="search"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-stitch px-3 py-2 text-pale text-sm"
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-variant border-b border-outline/20 bg-surface-variant/30">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">City</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-outline/10">
                <td className="p-4 text-pale">{m.name}</td>
                <td className="p-4 text-on-surface-variant">{m.city}</td>
                <td className="p-4">
                  <span className="text-xs uppercase text-mint">{m.status}</span>
                </td>
                <td className="p-4">
                  <Link href={`/admin/mosques/${m.id}`} className="text-gold text-sm hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Mosque">
        <MosqueForm onSubmit={handleCreate} />
      </Modal>
    </div>
  );
}
