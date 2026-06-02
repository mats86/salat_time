'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/components/providers/LangProvider';
import { Card } from '@/components/ui/Card';
import directus, { readItems } from '@/lib/directus';
import type { MosqueStaff } from '@/types';

export default function AdminStaffPage() {
  const { tr } = useLang();
  const [staff, setStaff] = useState<MosqueStaff[]>([]);

  useEffect(() => {
    directus
      .request(readItems('mosque_staff', { fields: ['*'], limit: 50 }))
      .then(setStaff)
      .catch(() => setStaff([]));
  }, []);

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.staff}</h1>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-variant border-b border-outline/20">
              <th className="text-left p-4">User ID</th>
              <th className="text-left p-4">Mosque</th>
              <th className="text-left p-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-on-surface-variant">
                  No staff assigned yet
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id} className="border-b border-outline/10">
                  <td className="p-4 text-pale font-mono text-xs">{s.user_id}</td>
                  <td className="p-4 text-on-surface-variant font-mono text-xs">{s.mosque_id}</td>
                  <td className="p-4 text-mint capitalize">{s.role}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
