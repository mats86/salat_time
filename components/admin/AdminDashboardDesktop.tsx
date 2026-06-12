import Link from 'next/link';
import {
  REQUEST_TYPE_META,
  STATUS_META,
  formatStatValue,
  getMosqueLabel,
} from '@/components/admin/admin-dashboard-utils';
import type { ChangeRequest, Mosque } from '@/types';

const CHART_BARS = [
  { day: 'MON', height: 'h-[60%]' },
  { day: 'TUE', height: 'h-[80%]' },
  { day: 'WED', height: 'h-[75%]' },
  { day: 'THU', height: 'h-[95%]', highlight: true },
  { day: 'FRI', height: 'h-[70%]' },
  { day: 'SAT', height: 'h-[85%]' },
  { day: 'SUN', height: 'h-[65%]' },
];

interface AdminDashboardDesktopProps {
  mosqueCount: number;
  staffCount: number;
  pendingCount: number;
  recentRequests: ChangeRequest[];
  mosques: Mosque[];
}

export function AdminDashboardDesktop({
  mosqueCount,
  staffCount,
  pendingCount,
  recentRequests,
  mosques,
}: AdminDashboardDesktopProps) {
  return (
    <div className="hidden md:block space-y-stack-lg">
      <section className="space-y-stack-sm">
        <p className="text-label-caps font-label-caps text-secondary uppercase tracking-widest">
          System Overview
        </p>
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          As-salamu alaykum, Administrator
        </h3>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 admin-stat-glow">
          <p className="text-label-caps font-label-caps text-on-surface-variant">TOTAL MOSQUES</p>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display-lg text-display-lg text-primary">
              {formatStatValue(mosqueCount)}
            </span>
            <span className="text-tertiary flex items-center text-body-sm">
              <span className="material-symbols-outlined text-sm">arrow_upward</span> 12%
            </span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-outline-variant/30">
          <p className="text-label-caps font-label-caps text-on-surface-variant">ACTIVE STAFF</p>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display-lg text-display-lg text-primary">
              {formatStatValue(staffCount)}
            </span>
            <span className="text-on-surface-variant text-body-sm">Verified</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-outline-variant/30 border-l-secondary-container/50 border-l-2">
          <p className="text-label-caps font-label-caps text-secondary">PENDING REQUESTS</p>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display-lg text-display-lg text-secondary">
              {formatStatValue(pendingCount, true)}
            </span>
            <span className="text-error flex items-center text-body-sm font-bold">Action Req.</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-outline-variant/30">
          <p className="text-label-caps font-label-caps text-on-surface-variant">MONTHLY USERS</p>
          <div className="flex items-end justify-between mt-2">
            <span className="font-display-lg text-display-lg text-primary">12.8k</span>
            <span className="text-tertiary flex items-center text-body-sm">
              <span className="material-symbols-outlined text-sm">arrow_upward</span> 4k
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 glass-panel rounded-xl border border-outline-variant/30 overflow-hidden">
          <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
            <h4 className="font-title-md text-title-md text-on-surface">Recent Mosque Requests</h4>
            <Link
              href="/admin/requests"
              className="text-label-caps font-label-caps text-primary hover:underline"
            >
              VIEW ALL
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">
                    MOSQUE NAME
                  </th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant">
                    REQUEST TYPE
                  </th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant text-center">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant text-right">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-10 text-center text-body-sm text-on-surface-variant"
                    >
                      No recent requests
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((req) => {
                    const typeMeta = REQUEST_TYPE_META[req.type];
                    const statusMeta = STATUS_META[req.status];
                    const label = getMosqueLabel(req.mosque_id, mosques);

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-surface-container-high/50 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-body-lg text-body-lg text-on-surface">
                              {label.name}
                            </span>
                            <span className="text-body-sm text-on-surface-variant">
                              {label.location}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-body-sm ${typeMeta.badgeClass}`}
                          >
                            <span className="material-symbols-outlined text-sm">{typeMeta.icon}</span>
                            {typeMeta.label}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={statusMeta.className}>{statusMeta.label}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            href="/admin/requests"
                            className="inline-flex text-primary hover:text-secondary transition-all p-2 rounded-full hover:bg-surface-container-highest"
                          >
                            <span className="material-symbols-outlined">chevron_right</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-gutter">
          <div className="glass-panel p-8 rounded-xl border border-outline-variant/30 flex flex-col justify-center items-center text-center relative overflow-hidden h-full min-h-[400px]">
            <div className="absolute inset-0 z-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" />
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: 'radial-gradient(#b1ccc4 0.5px, transparent 0.5px)',
                  backgroundSize: '24px 24px',
                }}
              />
            </div>
            <div className="z-10 space-y-6 w-full">
              <span
                className="material-symbols-outlined text-6xl text-primary/50"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                add_circle
              </span>
              <h4 className="font-headline-lg text-headline-lg text-on-surface">Quick Actions</h4>
              <p className="text-body-sm text-on-surface-variant px-4">
                Easily expand your network by onboarding new institutions or specialized staff
                members.
              </p>
              <div className="grid grid-cols-1 gap-4 w-full">
                <Link
                  href="/admin/mosques"
                  className="w-full bg-primary text-on-primary py-4 px-6 rounded-xl font-title-md text-title-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined">mosque</span>
                  Add New Mosque
                </Link>
                <Link
                  href="/admin/staff"
                  className="w-full border border-primary/40 text-primary py-4 px-6 rounded-xl font-title-md text-title-md hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  Staff Invite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel p-8 rounded-xl border border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h4 className="font-title-md text-title-md text-on-surface">
              Prayer Time Accuracy Index
            </h4>
            <p className="text-body-sm text-on-surface-variant">
              Global synchronization status across all managed mosques.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="bg-surface-container-highest px-4 py-2 rounded-lg text-label-caps font-label-caps text-primary border border-outline-variant/30">
              WEEKLY
            </div>
            <div className="px-4 py-2 rounded-lg text-label-caps font-label-caps text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer">
              MONTHLY
            </div>
          </div>
        </div>
        <div className="h-48 w-full flex items-end gap-2 md:gap-4 px-2">
          {CHART_BARS.map((bar) => (
            <div
              key={bar.day}
              title={bar.day}
              className={`flex-1 transition-all rounded-t-lg ${bar.height} ${
                bar.highlight
                  ? 'bg-secondary/30 hover:bg-secondary/50 border-t-2 border-secondary'
                  : 'bg-primary/20 hover:bg-primary/40'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4 text-label-caps font-label-caps text-on-surface-variant/50 px-2">
          {CHART_BARS.map((bar) => (
            <span key={bar.day}>{bar.day}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
