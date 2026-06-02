'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Mosque } from '@/types';

interface MosqueFormProps {
  mosque?: Partial<Mosque>;
  onSubmit: (data: Partial<Mosque>) => Promise<void>;
}

export function MosqueForm({ mosque, onSubmit }: MosqueFormProps) {
  const { tr } = useLang();
  const [form, setForm] = useState({
    name: mosque?.name ?? '',
    name_ar: mosque?.name_ar ?? '',
    name_en: mosque?.name_en ?? '',
    city: mosque?.city ?? '',
    address: mosque?.address ?? '',
    latitude: mosque?.latitude?.toString() ?? '',
    longitude: mosque?.longitude?.toString() ?? '',
    opening_hours: mosque?.opening_hours ?? '',
    has_women_area: mosque?.has_women_area ?? false,
    has_parking: mosque?.has_parking ?? false,
    has_wudu: mosque?.has_wudu ?? false,
    has_wheelchair: mosque?.has_wheelchair ?? false,
    status: mosque?.status ?? 'draft',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      ...form,
      latitude: parseFloat(form.latitude) || null,
      longitude: parseFloat(form.longitude) || null,
    });
    setSubmitting(false);
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (DE)" required />
        <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} placeholder="Name (AR)" />
        <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} placeholder="Name (EN)" />
        <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
        <textarea
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Address"
          className="w-full bg-white/5 border border-white/10 rounded-stitch px-3 py-2 text-pale text-sm min-h-[80px]"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="Lat" />
          <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="Lng" />
        </div>
        <textarea
          value={form.opening_hours}
          onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
          placeholder={tr.openingHours}
          className="w-full bg-white/5 border border-white/10 rounded-stitch px-3 py-2 text-pale text-sm min-h-[60px]"
        />
        {(['has_women_area', 'has_parking', 'has_wudu', 'has_wheelchair'] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-pale">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
            />
            {key.replace('has_', '').replace('_', ' ')}
          </label>
        ))}
        <Button type="submit" disabled={submitting}>
          {tr.submit}
        </Button>
      </form>
    </Card>
  );
}
