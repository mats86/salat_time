'use client';

import { useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

interface EventFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

export function EventForm({ onSubmit }: EventFormProps) {
  const { tr } = useLang();
  const [title, setTitle] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({
      title,
      title_ar: titleAr,
      title_en: titleEn,
      event_date: date,
      event_time: time,
    });
    setSubmitting(false);
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Titel (DE)" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <Input placeholder="Titel (AR)" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        <Input placeholder="Titel (EN)" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <Button type="submit" disabled={submitting}>
          {tr.submit}
        </Button>
      </form>
    </Card>
  );
}
