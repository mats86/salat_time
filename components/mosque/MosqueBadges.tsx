'use client';

import { useLang } from '@/components/providers/LangProvider';
import { Badge } from '@/components/ui/Badge';
import type { Mosque } from '@/types';

export function MosqueBadges({ mosque }: { mosque: Mosque }) {
  const { tr } = useLang();
  const badges = [
    mosque.has_women_area && { label: tr.women, icon: 'woman' },
    mosque.has_parking && { label: tr.parking, icon: 'local_parking' },
    mosque.has_wudu && { label: tr.wudu, icon: 'water_drop' },
    mosque.has_wheelchair && { label: tr.wheelchair, icon: 'accessible' },
  ].filter(Boolean) as { label: string; icon: string }[];

  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <Badge key={b.label}>
          <span className="material-symbols-outlined text-xs align-middle mr-1">{b.icon}</span>
          {b.label}
        </Badge>
      ))}
    </div>
  );
}
