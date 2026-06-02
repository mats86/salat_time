'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import directus, { readItems, updateItem } from '@/lib/directus';
import type { ChangeRequest } from '@/types';

export default function AdminRequestsPage() {
  const { tr } = useLang();
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = () => {
    directus
      .request(
        readItems('change_requests', {
          filter: { status: { _eq: 'pending' } },
          sort: ['-date_created'],
          limit: 50,
        })
      )
      .then(setRequests)
      .catch(() => setRequests([]));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    await directus.request(
      updateItem('change_requests', id, {
        status: 'approved',
        date_reviewed: new Date().toISOString(),
      })
    );
    load();
  };

  const reject = async () => {
    if (!rejectId || !note.trim()) return;
    await directus.request(
      updateItem('change_requests', rejectId, {
        status: 'rejected',
        admin_note: note,
        date_reviewed: new Date().toISOString(),
      })
    );
    setRejectId(null);
    setNote('');
    load();
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.requests}</h1>
      {requests.length === 0 ? (
        <Card className="p-8 text-center text-on-surface-variant">No pending requests</Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id} className="p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <Badge variant="pending">{r.type}</Badge>
                  <p className="text-pale mt-2 font-mono text-xs">{r.mosque_id}</p>
                  <pre className="mt-3 text-xs text-on-surface-variant bg-surface-variant/50 p-3 rounded-stitch overflow-auto max-h-32">
                    {JSON.stringify(r.payload, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => approve(r.id)}>
                    {tr.approve}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectId(r.id)}>
                    {tr.reject}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title={tr.rejectionReason}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr.rejectionReason} />
        <Button className="mt-4 w-full" variant="danger" onClick={reject}>
          {tr.reject}
        </Button>
      </Modal>
    </div>
  );
}
