'use client';

import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsMobile } from '@/components/settings/SettingsMobile';
import { BottomNav } from '@/components/layout/BottomNav';

export default function SettingsPage() {
  return (
    <div className="md:hidden settings-mobile-shell text-on-background font-body-lg min-h-screen selection:bg-secondary/30">
      <SettingsHeader />
      <SettingsMobile />
      <BottomNav />
    </div>
  );
}
