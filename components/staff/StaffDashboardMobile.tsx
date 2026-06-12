'use client';

import { useState } from 'react';
import Link from 'next/link';
import directus, { createItem } from '@/lib/directus';
import {
  MOBILE_EVENTS,
  MOBILE_FACILITIES,
  MOBILE_PRAYER_ROWS,
  applyOffset,
  formatOffsetLabel,
  type MobileStaffPrayerRow,
  type PrayerMethod,
  type StaffEventItem,
  type StaffFacility,
} from '@/components/staff/staff-dashboard-utils';

const DEMO_MOSQUE_ID = '7df677b5-43da-4c80-a9d3-e003dc41254a';

interface StaffDashboardMobileProps {
  mosqueSubtitle?: string;
  hasPendingRequest?: boolean;
}

export function StaffDashboardMobile({
  mosqueSubtitle = 'Central Masjid Berlin Mitte',
  hasPendingRequest = true,
}: StaffDashboardMobileProps) {
  const [prayers, setPrayers] = useState<MobileStaffPrayerRow[]>(MOBILE_PRAYER_ROWS);
  const [facilities, setFacilities] = useState<StaffFacility[]>(MOBILE_FACILITIES);
  const [events, setEvents] = useState<StaffEventItem[]>(MOBILE_EVENTS);
  const [saving, setSaving] = useState(false);

  const updatePrayer = (name: MobileStaffPrayerRow['name'], patch: Partial<MobileStaffPrayerRow>) => {
    setPrayers((rows) => rows.map((row) => (row.name === name ? { ...row, ...patch } : row)));
  };

  const adjustOffset = (name: MobileStaffPrayerRow['name'], delta: number) => {
    setPrayers((rows) =>
      rows.map((row) =>
        row.name === name ? { ...row, offset: row.offset + delta, method: 'manual' } : row
      )
    );
  };

  const toggleFacility = (key: string) => {
    setFacilities((items) =>
      items.map((item) => (item.key === key ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const prayerPayload: Record<string, string | null> = {};
      for (const row of prayers) {
        const key = row.name.toLowerCase();
        prayerPayload[key] =
          row.method === 'manual' ? applyOffset(row.baseTime, row.offset) : null;
      }

      const facilityPayload = facilities.reduce<Record<string, boolean>>((acc, item) => {
        if (item.field) acc[item.field] = item.checked;
        return acc;
      }, {});

      await Promise.all([
        directus.request(
          createItem('change_requests', {
            type: 'prayer_times',
            status: 'pending',
            mosque_id: DEMO_MOSQUE_ID,
            payload: prayerPayload,
          })
        ),
        directus.request(
          createItem('change_requests', {
            type: 'mosque_info',
            status: 'pending',
            mosque_id: DEMO_MOSQUE_ID,
            payload: facilityPayload,
          })
        ),
      ]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:hidden space-y-stack-lg">
      {hasPendingRequest && (
        <div className="bg-secondary-container/20 border border-secondary/30 p-4 rounded-xl flex items-center gap-3 animate-pulse">
          <span className="material-symbols-outlined text-secondary">info</span>
          <p className="text-body-sm text-secondary font-semibold">Pending Admin Approval</p>
        </div>
      )}

      <section className="space-y-1">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Staff Dashboard</h2>
        <p className="text-on-surface-variant font-title-md text-title-md">{mosqueSubtitle}</p>
      </section>

      <section className="space-y-stack-md">
        <div className="flex justify-between items-end">
          <h3 className="text-label-caps font-label-caps text-on-surface-variant">PRAYER MANAGEMENT</h3>
          <span className="text-[10px] text-secondary opacity-70">AUTO-SYNC ACTIVE</span>
        </div>

        <div className="space-y-3">
          {prayers.map((row) => {
            const finalTime = applyOffset(row.baseTime, row.method === 'manual' ? row.offset : 0);

            return (
              <div
                key={row.name}
                className={`staff-mobile-glass-card p-4 rounded-xl space-y-4 ${
                  row.highlighted ? 'border-secondary/40 active-prayer-ring' : ''
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-secondary"
                      style={row.iconFilled ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {row.icon}
                    </span>
                    <div>
                      <p className="font-title-md text-title-md text-on-surface">{row.name}</p>
                      <p className="text-body-sm text-on-surface-variant">Current: {row.baseTime}</p>
                    </div>
                  </div>
                  <div className="flex bg-surface-container-highest p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => updatePrayer(row.name, { method: 'automatic' as PrayerMethod, offset: 0 })}
                      className={`px-3 py-1 rounded-md text-label-caps text-[10px] ${
                        row.method === 'automatic'
                          ? 'bg-secondary text-on-secondary-container'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      AUTO
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePrayer(row.name, { method: 'manual' as PrayerMethod })}
                      className={`px-3 py-1 rounded-md text-label-caps text-[10px] ${
                        row.method === 'manual'
                          ? 'bg-secondary text-on-secondary-container'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      MANUAL
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/30">
                  <div className="flex-1">
                    <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">
                      OFFSET (MIN)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => adjustOffset(row.name, -1)}
                        disabled={row.method === 'automatic'}
                        className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center disabled:opacity-40"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={formatOffsetLabel(row.offset)}
                        className="bg-transparent border-b border-secondary text-center w-12 font-title-md text-title-md focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => adjustOffset(row.name, 1)}
                        disabled={row.method === 'automatic'}
                        className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-label-caps text-on-surface-variant">FINAL IQAMAH</p>
                    <p className="font-title-md text-title-md text-secondary">{finalTime}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-stack-md">
        <h3 className="text-label-caps font-label-caps text-on-surface-variant">MOSQUE FACILITIES</h3>
        <div className="staff-mobile-glass-card p-5 rounded-xl grid grid-cols-1 gap-4">
          {facilities.map((item) => (
            <label key={item.key} className="flex items-center justify-between group">
              <span className="text-body-lg">{item.label}</span>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleFacility(item.key)}
                className="w-5 h-5 rounded border-outline-variant bg-surface-container-high text-secondary focus:ring-secondary/20"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-stack-md">
        <div className="flex justify-between items-center">
          <h3 className="text-label-caps font-label-caps text-on-surface-variant">UPCOMING EVENTS</h3>
          <span className="text-[10px] text-primary">{events.length} TOTAL</span>
        </div>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="staff-mobile-glass-card p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex flex-col items-center justify-center text-secondary border border-secondary/20">
                <span className="text-[10px] font-bold">{event.month}</span>
                <span className="text-lg font-bold">{event.day}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-title-md text-title-md text-on-surface">{event.title}</h4>
                <p className="text-body-sm text-on-surface-variant">{event.time}</p>
              </div>
              <button
                type="button"
                onClick={() => setEvents((list) => list.filter((e) => e.id !== event.id))}
                className="text-error/70 hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
          <Link
            href="/staff/events"
            className="w-full py-4 border-2 border-dashed border-outline-variant/50 rounded-xl text-primary font-label-caps flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            ADD NEW EVENT
          </Link>
        </div>
      </section>

      <div className="fixed bottom-[88px] left-0 w-full px-margin-mobile z-40 md:hidden">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-secondary text-on-secondary-container py-4 rounded-xl shadow-lg shadow-secondary/20 flex items-center justify-center gap-2 font-title-md active:scale-95 transition-transform disabled:opacity-60"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            save
          </span>
          {saving ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
