'use client';

import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsMobile } from '@/components/settings/SettingsMobile';
import { SettingsDesktop } from '@/components/settings/SettingsDesktop';
import { BottomNav } from '@/components/layout/BottomNav';

export default function SettingsPage() {
  return (
    <>
      <SettingsDesktop />

      <div className="md:hidden settings-mobile-shell text-on-background font-body-lg min-h-screen selection:bg-secondary/30">
        <SettingsHeader />
        <SettingsMobile />
        <BottomNav />
      </div>
    </>
  );
}
