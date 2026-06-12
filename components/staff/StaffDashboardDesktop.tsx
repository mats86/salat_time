'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import directus, { createItem } from '@/lib/directus';
import {
  DEFAULT_EVENTS,
  DEFAULT_FACILITIES,
  DEFAULT_PRAYER_ROWS,
  applyOffset,
  formatTime12h,
  getActivePrayerName,
  type PrayerMethod,
  type StaffEventItem,
  type StaffFacility,
  type StaffPrayerRow,
} from '@/components/staff/staff-dashboard-utils';

const DEMO_MOSQUE_ID = '7df677b5-43da-4c80-a9d3-e003dc41254a';

interface StaffDashboardDesktopProps {
  mosqueName?: string;
  mosqueLocation?: string;
  hasPendingRequest?: boolean;
}

export function StaffDashboardDesktop({
  mosqueName = 'Central Masjid Management',
  mosqueLocation = 'Berlin Mitte',
  hasPendingRequest = true,
}: StaffDashboardDesktopProps) {
  const [prayers, setPrayers] = useState<StaffPrayerRow[]>(DEFAULT_PRAYER_ROWS);
  const [facilities, setFacilities] = useState<StaffFacility[]>(DEFAULT_FACILITIES);
  const [events, setEvents] = useState<StaffEventItem[]>(DEFAULT_EVENTS);
  const [saving, setSaving] = useState(false);

  const activePrayer = useMemo(() => getActivePrayerName(), []);

  const updatePrayer = (name: StaffPrayerRow['name'], patch: Partial<StaffPrayerRow>) => {
    setPrayers((rows) => rows.map((row) => (row.name === name ? { ...row, ...patch } : row)));
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
        if (row.method === 'manual') {
          prayerPayload[key] = applyOffset(row.baseTime, row.offset);
        } else {
          prayerPayload[key] = null;
        }
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
    <div className="hidden md:block">
      {hasPendingRequest && (
        <div className="mb-8 p-4 rounded-xl border border-secondary-container bg-secondary-container/10 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3 text-secondary">
            <span className="material-symbols-outlined">error_outline</span>
            <span className="font-title-md text-title-md">Pending Admin Approval</span>
          </div>
          <Link
            href="/staff/times"
            className="bg-secondary text-on-secondary px-4 py-1.5 rounded-lg font-label-caps text-label-caps hover:scale-95 transition-transform"
          >
            Review Changes
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-10">
        <section>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Staff Dashboard</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            {mosqueName} — {mosqueLocation}
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                Prayer Time Management
              </h3>
              <span className="text-xs text-on-surface-variant opacity-60">Last updated: 14 mins ago</span>
            </div>

            <div className="grid gap-4">
              {prayers.map((row) => {
                const isActive = row.name === activePrayer;
                const isAutomatic = row.method === 'automatic';
                const resultTime = formatTime12h(applyOffset(row.baseTime, isAutomatic ? 0 : row.offset));

                return (
                  <div
                    key={row.name}
                    className={`glass-card p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 ${
                      isActive ? 'active-glow' : ''
                    } ${row.dimmed && !isActive ? 'opacity-80' : ''}`}
                  >
                    <div className="flex items-center gap-4 min-w-[120px]">
                      <span
                        className={`material-symbols-outlined ${
                          isActive ? 'text-secondary' : 'text-primary-fixed-dim'
                        }`}
                      >
                        {row.icon}
                      </span>
                      <span className="font-title-md text-title-md">{row.name}</span>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-label-caps text-on-surface-variant">
                          METHOD
                        </label>
                        <select
                          value={row.method}
                          onChange={(e) =>
                            updatePrayer(row.name, {
                              method: e.target.value as PrayerMethod,
                              offset: e.target.value === 'automatic' ? 0 : row.offset,
                            })
                          }
                          className="bg-transparent border-b border-outline-variant focus:border-secondary text-body-sm outline-none cursor-pointer"
                        >
                          <option className="bg-surface" value="automatic">
                            Automatic
                          </option>
                          <option className="bg-surface" value="manual">
                            Manual Offset
                          </option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-label-caps text-on-surface-variant">
                          OFFSET (MIN)
                        </label>
                        <input
                          type="number"
                          value={row.offset}
                          disabled={isAutomatic}
                          onChange={(e) =>
                            updatePrayer(row.name, { offset: Number(e.target.value) || 0 })
                          }
                          className={`w-16 bg-transparent border-b text-body-sm outline-none ${
                            isAutomatic
                              ? 'border-outline-variant/30 opacity-40'
                              : 'border-outline-variant focus:border-secondary'
                          }`}
                        />
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] font-label-caps text-on-surface-variant">RESULT</p>
                        <p className="font-title-md text-title-md text-secondary">{resultTime}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="lg:col-span-4 flex flex-col gap-8">
            <section className="glass-card p-6 rounded-2xl">
              <h3 className="font-title-md text-title-md mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">checklist</span>
                Mosque Facilities
              </h3>
              <div className="grid gap-4">
                {facilities.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <span className={`text-body-sm ${item.checked ? '' : 'opacity-60'}`}>
                      {item.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleFacility(item.key)}
                      className="w-5 h-5 rounded border-outline-variant bg-transparent text-secondary focus:ring-secondary/20"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-title-md text-title-md flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">event</span>
                  Upcoming Events
                </h3>
                <Link
                  href="/staff/events"
                  className="text-primary hover:text-secondary transition-colors material-symbols-outlined"
                >
                  add_circle
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {events.map((event) => (
                  <div key={event.id} className="glass-card p-4 rounded-xl flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-label-caps ${
                        event.accent === 'primary'
                          ? 'bg-primary-container/30 text-primary'
                          : 'bg-tertiary-container/30 text-tertiary'
                      }`}
                    >
                      <span className="text-xs">{event.month}</span>
                      <span className="text-lg">{event.day}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-title-md text-title-md text-on-surface">{event.title}</p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {event.time}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEvents((list) => list.filter((e) => e.id !== event.id))}
                      className="material-symbols-outlined text-on-surface-variant hover:text-error"
                    >
                      delete
                    </button>
                  </div>
                ))}
              </div>

              <Link
                href="/staff/events"
                className="w-full py-3 border border-dashed border-outline-variant rounded-xl text-on-surface-variant text-body-sm hover:border-primary hover:text-primary transition-all text-center"
              >
                + Add New Event
              </Link>
            </section>
          </aside>
        </div>
      </div>

      <div className="hidden md:flex fixed bottom-8 right-8 z-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-3 bg-primary text-on-primary px-6 py-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group disabled:opacity-60"
        >
          <span className="material-symbols-outlined font-bold">save</span>
          <span className="font-title-md text-title-md">
            {saving ? 'Saving…' : 'Save All Changes'}
          </span>
        </button>
      </div>
    </div>
  );
}
