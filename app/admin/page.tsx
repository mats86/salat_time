import Link from 'next/link';
import { fetchPublishedMosques, fetchPendingChangeRequests } from '@/lib/directus-server';
import { Card } from '@/components/ui/Card';

export default async function AdminOverviewPage() {
  let mosques: Awaited<ReturnType<typeof fetchPublishedMosques>> = [];
  let requests: Awaited<ReturnType<typeof fetchPendingChangeRequests>> = [];
  try {
    const [m, r] = await Promise.all([
      fetchPublishedMosques(),
      fetchPendingChangeRequests(),
    ]);
    mosques = Array.isArray(m) ? m : [];
    requests = Array.isArray(r) ? r : [];
  } catch {
    /* use empty */
  }

  const stats = [
    { label: 'Total Mosques', value: mosques.length, icon: 'mosque' },
    { label: 'Open Requests', value: requests.length, icon: 'pending_actions' },
    { label: 'Active Staff', value: '—', icon: 'group' },
    { label: 'App Users', value: '—', icon: 'people' },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <h1 className="font-headline text-3xl text-gold">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-6">
            <span className="material-symbols-outlined text-gold text-2xl">{s.icon}</span>
            <p className="text-3xl font-headline text-pale mt-3">{s.value}</p>
            <p className="text-on-surface-variant text-sm mt-1">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline text-lg text-pale">Recent Mosques</h2>
          <Link href="/admin/requests" className="text-sm text-gold">
            View requests →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-on-surface-variant border-b border-outline/20">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">City</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {mosques.slice(0, 5).map((m) => (
                <tr key={m.id} className="border-b border-outline/10">
                  <td className="py-3 text-pale">{m.name}</td>
                  <td className="py-3 text-on-surface-variant">{m.city}</td>
                  <td className="py-3">
                    <span className="text-mint text-xs uppercase">{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
