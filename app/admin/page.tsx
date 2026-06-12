import {
  fetchPublishedMosques,
  fetchPendingChangeRequests,
  fetchRecentChangeRequests,
  fetchMosqueStaff,
} from '@/lib/directus-server';
import { AdminDashboardDesktop } from '@/components/admin/AdminDashboardDesktop';
import { AdminDashboardMobile } from '@/components/admin/AdminDashboardMobile';
import type { ChangeRequest, Mosque } from '@/types';

export default async function AdminOverviewPage() {
  let mosques: Mosque[] = [];
  let pendingRequests: ChangeRequest[] = [];
  let recentRequests: ChangeRequest[] = [];
  let staffCount = 0;

  try {
    const [m, pending, recent, staff] = await Promise.all([
      fetchPublishedMosques(),
      fetchPendingChangeRequests(),
      fetchRecentChangeRequests(5),
      fetchMosqueStaff(),
    ]);
    mosques = Array.isArray(m) ? m : [];
    pendingRequests = Array.isArray(pending) ? pending : [];
    recentRequests = Array.isArray(recent) ? recent : [];
    staffCount = Array.isArray(staff) ? staff.length : 0;
  } catch {
    /* use empty defaults */
  }

  const props = {
    mosqueCount: mosques.length,
    staffCount,
    pendingCount: pendingRequests.length,
    recentRequests,
    mosques,
  };

  return (
    <>
      <AdminDashboardMobile {...props} />
      <AdminDashboardDesktop {...props} />
    </>
  );
}
