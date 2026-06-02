'use client';

import { useLang } from '@/components/providers/LangProvider';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function StaffOverviewPage() {
  const { tr } = useLang();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-headline text-2xl text-gold">{tr.overview}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-on-surface-variant text-sm">Mosque</p>
          <h2 className="font-headline text-xl text-pale mt-1">Al-Noor Mosque</h2>
          <p className="text-on-surface-variant text-sm mt-2">Wedding, Berlin</p>
        </Card>
        <Card className="p-6">
          <p className="text-on-surface-variant text-sm">{tr.prayerTimes}</p>
          <p className="text-3xl font-headline text-gold mt-2">4/6</p>
          <p className="text-xs text-on-surface-variant">{tr.ownTime}</p>
        </Card>
        <Card className="p-6">
          <p className="text-on-surface-variant text-sm">{tr.events}</p>
          <p className="text-3xl font-headline text-mint mt-2">2</p>
          <p className="text-xs text-on-surface-variant">Active</p>
        </Card>
        <Card className="p-6">
          <p className="text-on-surface-variant text-sm">{tr.requests}</p>
          <Badge variant="pending" className="mt-2">
            1 {tr.pending}
          </Badge>
        </Card>
      </div>
    </div>
  );
}
