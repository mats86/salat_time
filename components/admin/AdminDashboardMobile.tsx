import Link from 'next/link';
import {
  MOBILE_STATUS_META,
  formatStatValue,
  getMosqueLabel,
} from '@/components/admin/admin-dashboard-utils';
import type { ChangeRequest, Mosque } from '@/types';

const MOBILE_CHART_BARS = [
  { height: 'h-[60%]', highlight: false },
  { height: 'h-[80%]', highlight: false },
  { height: 'h-[95%]', highlight: true },
  { height: 'h-[70%]', highlight: false },
  { height: 'h-[85%]', highlight: false },
  { height: 'h-[75%]', highlight: false },
  { height: 'h-[90%]', highlight: false },
];

const METRIC_CARDS = [
  {
    key: 'mosques',
    icon: 'account_balance',
    iconClass: 'text-primary',
    label: 'TOTAL MOSQUES',
    glow: false,
  },
  {
    key: 'staff',
    icon: 'badge',
    iconClass: 'text-tertiary',
    label: 'ACTIVE STAFF',
    glow: false,
  },
  {
    key: 'pending',
    icon: 'pending_actions',
    iconClass: 'text-secondary',
    label: 'PENDING',
    glow: true,
  },
  {
    key: 'users',
    icon: 'group',
    iconClass: 'text-primary',
    label: 'MONTHLY USERS',
    glow: false,
  },
] as const;

interface AdminDashboardMobileProps {
  mosqueCount: number;
  staffCount: number;
  pendingCount: number;
  recentRequests: ChangeRequest[];
  mosques: Mosque[];
}

function getMetricValue(
  key: (typeof METRIC_CARDS)[number]['key'],
  mosqueCount: number,
  staffCount: number,
  pendingCount: number
): string {
  switch (key) {
    case 'mosques':
      return formatStatValue(mosqueCount);
    case 'staff':
      return formatStatValue(staffCount);
    case 'pending':
      return formatStatValue(pendingCount);
    case 'users':
      return '8.2k';
    default:
      return '0';
  }
}

export function AdminDashboardMobile({
  mosqueCount,
  staffCount,
  pendingCount,
  recentRequests,
  mosques,
}: AdminDashboardMobileProps) {
  return (
    <div className="md:hidden">
      <section className="mb-stack-lg">
        <p className="text-label-caps font-label-caps text-secondary mb-1">WELCOME BACK</p>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface leading-tight">
          As-salamu alaykum, Administrator
        </h2>
      </section>

      <section className="mb-stack-lg overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile flex gap-4">
        {METRIC_CARDS.map((card) => (
          <div
            key={card.key}
            className={`min-w-[160px] glass-card p-4 rounded-xl border border-outline-variant/30 ${
              card.glow ? 'mobile-metric-glow' : ''
            }`}
          >
            <span className={`material-symbols-outlined ${card.iconClass} mb-2 block`}>
              {card.icon}
            </span>
            <p className="text-label-caps font-label-caps text-on-surface-variant">{card.label}</p>
            <p className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {getMetricValue(card.key, mosqueCount, staffCount, pendingCount)}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-stack-lg">
        <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-4">
          QUICK ACTIONS
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/admin/mosques"
            className="flex flex-col items-center justify-center gap-2 p-4 bg-primary-container rounded-xl text-primary hover:bg-primary-container/80 transition-all active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[32px]">add_business</span>
            <span className="text-label-caps font-label-caps">ADD MOSQUE</span>
          </Link>
          <Link
            href="/admin/staff"
            className="flex flex-col items-center justify-center gap-2 p-4 bg-secondary-container rounded-xl text-on-secondary-container hover:bg-secondary-container/80 transition-all active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined text-[32px]">person_add</span>
            <span className="text-label-caps font-label-caps">STAFF INVITE</span>
          </Link>
        </div>
      </section>

      <section className="mb-stack-lg glass-card p-6 rounded-xl border border-outline-variant/30">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-label-caps font-label-caps text-on-surface">ACCURACY INDEX</h3>
          <span className="text-label-caps font-label-caps text-tertiary">98.4%</span>
        </div>
        <div className="h-32 flex items-end justify-between gap-2">
          {MOBILE_CHART_BARS.map((bar, index) => (
            <div
              key={index}
              className={`w-full rounded-t-sm transition-all ${bar.height} ${
                bar.highlight
                  ? 'bg-primary shadow-[0_0_10px_rgba(177,204,196,0.3)]'
                  : 'bg-primary/20 hover:bg-primary'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-on-surface-variant font-label-caps">MON</span>
          <span className="text-[10px] text-on-surface-variant font-label-caps">SUN</span>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-label-caps font-label-caps text-on-surface-variant uppercase">
            Recent Requests
          </h3>
          <Link href="/admin/requests" className="text-label-caps font-label-caps text-primary underline">
            VIEW ALL
          </Link>
        </div>
        <div className="space-y-3">
          {recentRequests.length === 0 ? (
            <div className="glass-card p-4 rounded-xl border border-outline-variant/30 text-center text-body-sm text-on-surface-variant">
              No recent requests
            </div>
          ) : (
            recentRequests.slice(0, 3).map((req) => {
              const statusMeta = MOBILE_STATUS_META[req.status];
              const label = getMosqueLabel(req.mosque_id, mosques);

              return (
                <Link
                  key={req.id}
                  href="/admin/requests"
                  className="glass-card p-4 rounded-xl border border-outline-variant/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-title-md text-title-md text-on-surface truncate">
                        {label.name}
                      </p>
                      <p className="text-body-sm text-on-surface-variant">{label.location}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={statusMeta.className}>{statusMeta.label}</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">
                      chevron_right
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
