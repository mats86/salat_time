import { StaffDashboardDesktop } from '@/components/staff/StaffDashboardDesktop';
import { StaffDashboardMobile } from '@/components/staff/StaffDashboardMobile';

export default function StaffOverviewPage() {
  return (
    <>
      <StaffDashboardMobile />
      <StaffDashboardDesktop />
    </>
  );
}
