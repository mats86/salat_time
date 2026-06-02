'use client';

import { useLang } from '@/components/providers/LangProvider';
import { EventForm } from '@/components/forms/EventForm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import directus, { createItem } from '@/lib/directus';

export default function StaffEventsPage() {
  const { tr } = useLang();

  const handleSubmit = async (data: Record<string, unknown>) => {
    await directus.request(
      createItem('change_requests', {
        type: 'event',
        status: 'pending',
        mosque_id: '7df677b5-43da-4c80-a9d3-e003dc41254a',
        payload: data,
      })
    );
    alert('Event change request submitted');
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.events}</h1>
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <span className="text-pale">Friday Lecture</span>
          <Badge variant="mint">{tr.approved}</Badge>
        </div>
      </Card>
      <EventForm onSubmit={handleSubmit} />
    </div>
  );
}
