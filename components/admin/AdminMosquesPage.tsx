'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MosqueForm } from '@/components/forms/MosqueForm';
import { Modal } from '@/components/ui/Modal';
import directus, { readItems, createItem } from '@/lib/directus';
import {
  STATUS_BADGE,
  buildMosqueRows,
  type MosqueDisplayStatus,
  type MosqueTableRow,
} from '@/components/admin/admin-mosques-utils';
import type { Mosque, MosqueStaff } from '@/types';

const PAGE_SIZE = 10;

function SyncCell({ row }: { row: MosqueTableRow }) {
  if (row.syncStatus === 'auto') {
    return (
      <div className="flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined text-[20px]">sync</span>
        <span className="text-body-sm">Auto-syncing</span>
      </div>
    );
  }
  if (row.syncStatus === 'manual') {
    return (
      <div className="flex items-center gap-2 text-on-surface-variant/50 italic">
        <span className="material-symbols-outlined text-[20px]">sync_disabled</span>
        <span className="text-body-sm">Manual only</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-error">
      <span className="material-symbols-outlined text-[20px]">error</span>
      <span className="text-body-sm">Sync failed</span>
    </div>
  );
}

export function AdminMosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [staffByMosque, setStaffByMosque] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MosqueDisplayStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'staff'>('newest');
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const [m, staff] = await Promise.all([
        directus.request(readItems('mosques', { fields: ['*'], limit: 100 })),
        directus.request(readItems('mosque_staff', { fields: ['*'], limit: 500 })),
      ]);
      setMosques(Array.isArray(m) ? m : []);
      const counts: Record<string, number> = {};
      (Array.isArray(staff) ? staff : []).forEach((s: MosqueStaff) => {
        counts[s.mosque_id] = (counts[s.mosque_id] ?? 0) + 1;
      });
      setStaffByMosque(counts);
    } catch {
      setMosques([]);
      setStaffByMosque({});
    }
  };

  useEffect(() => {
    load();
  }, []);

  const allRows = useMemo(() => buildMosqueRows(mosques, staffByMosque), [mosques, staffByMosque]);

  const filtered = useMemo(() => {
    let rows = allRows.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (sortBy === 'name') {
      rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'staff') {
      rows = [...rows].sort((a, b) => b.staffCount - a.staffCount);
    }
    return rows;
  }, [allRows, search, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const total = filtered.length;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const handleCreate = async (data: Partial<Mosque>) => {
    await directus.request(createItem('mosques', { ...data, status: 'published' }));
    setModalOpen(false);
    await load();
  };

  return (
    <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] -z-10 rounded-full pointer-events-none" />

      <header className="px-margin-desktop py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <nav className="flex items-center gap-2 text-body-sm text-on-surface-variant mb-2">
            <span>Administrative Overview</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary font-semibold">Mosques</span>
          </nav>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Mosque Management</h2>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-secondary text-on-secondary-container px-6 py-3 rounded-full font-title-md text-title-md hover:brightness-110 active:scale-95 transition-all shadow-xl"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Mosque
        </button>
      </header>

      <section className="px-margin-desktop mb-6 shrink-0">
        <div className="admin-mosques-glass p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center border border-outline-variant/20">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, city, or zip code..."
              className="w-full bg-surface-container-lowest border-none focus:ring-1 focus:ring-secondary rounded-xl pl-12 pr-4 py-3 text-body-lg text-on-surface placeholder:text-on-surface-variant/50 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="bg-surface-container-lowest border-none focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 text-body-sm text-on-surface-variant min-w-[140px] outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending Review</option>
              <option value="offline">Offline</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-surface-container-lowest border-none focus:ring-1 focus:ring-secondary rounded-xl px-4 py-3 text-body-sm text-on-surface-variant min-w-[140px] outline-none"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="staff">Staff Count</option>
            </select>
            <button
              type="button"
              className="p-3 bg-surface-container-high text-on-surface rounded-xl hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>
      </section>

      <section className="flex-1 px-margin-desktop overflow-hidden flex flex-col mb-6 min-h-0">
        <div className="admin-mosques-glass flex-1 rounded-2xl border border-outline-variant/20 overflow-hidden flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-high/40">
                  <th className="px-6 py-5 font-label-caps text-on-surface-variant">
                    Mosque Name &amp; Location
                  </th>
                  <th className="px-6 py-5 font-label-caps text-on-surface-variant">Status</th>
                  <th className="px-6 py-5 font-label-caps text-on-surface-variant">Staff Count</th>
                  <th className="px-6 py-5 font-label-caps text-on-surface-variant">Sync Status</th>
                  <th className="px-6 py-5 font-label-caps text-on-surface-variant text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {pageRows.map((row) => {
                  const badge = STATUS_BADGE[row.status];
                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-primary/5 transition-colors group ${
                        row.highlighted
                          ? 'active-row-glow bg-secondary/5 border-l-4 border-l-secondary'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant/20">
                            <span className={`material-symbols-outlined ${row.iconClass}`}>
                              {row.icon}
                            </span>
                          </div>
                          <div>
                            <p
                              className={`font-title-md group-hover:text-secondary transition-colors ${
                                row.dimmed
                                  ? 'text-on-surface-variant opacity-70'
                                  : 'text-on-surface'
                              }`}
                            >
                              {row.name}
                            </p>
                            <p
                              className={`text-body-sm text-on-surface-variant ${
                                row.dimmed ? 'opacity-50' : 'opacity-70'
                              }`}
                            >
                              {row.location}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={badge.className}>
                          {badge.pulse && (
                            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                          )}
                          {badge.icon && (
                            <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                          )}
                          {row.status === 'offline' && (
                            <span className="w-2 h-2 rounded-full bg-error" />
                          )}
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-2 ${
                            row.dimmed ? 'text-on-surface-variant opacity-70' : 'text-on-surface'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                            people
                          </span>
                          {row.staffCount} Staff
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <SyncCell row={row} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/mosques/${row.id}`}
                            className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </Link>
                          <Link
                            href={`/admin/mosques/${row.id}`}
                            className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </Link>
                          <button
                            type="button"
                            className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant"
                          >
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low/60 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <p className="text-body-sm text-on-surface-variant">
              Showing {from} to {to} of {total} mosques
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`w-10 h-10 rounded-lg font-body-sm ${
                      page === n
                        ? 'bg-secondary text-on-secondary-container font-bold text-body-sm'
                        : 'text-on-surface hover:bg-surface-variant'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {totalPages > 3 && (
                  <>
                    <span className="px-2 text-on-surface-variant">...</span>
                    <button
                      type="button"
                      onClick={() => setPage(totalPages)}
                      className="w-10 h-10 rounded-lg text-on-surface hover:bg-surface-variant font-body-sm"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-margin-desktop py-4 flex justify-between items-center bg-surface-container-lowest border-t border-outline-variant/20 shrink-0">
        <p className="text-body-sm text-on-surface-variant opacity-60">
          © 2024 Salat Zeit. Modern Islamic Excellence Admin Platform.
        </p>
        <div className="flex gap-6 text-body-sm text-on-surface-variant">
          <a href="#" className="hover:text-primary transition-colors">
            Documentation
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            API Keys
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Security
          </a>
        </div>
      </footer>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Mosque">
        <MosqueForm onSubmit={handleCreate} />
      </Modal>
    </main>
  );
}
