// src/pages/Dashboard.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '../utils/hooks';
import AppNav from '../components/AppNav';
import { pickApiBaseUrl } from '../lib/config';
import useDebounced from '../hooks/useDebounced';
import { listRecentContacts, type Contact } from '../services/contacts';
import ContactCard from '../components/contacts/ContactCard';
import EmptyState from '../components/EmptyState';
import NewContactModal from '../components/contacts/NewContactModal';
import Section from '../components/ui/Section';
import StatCard from '../components/home/StatCard';
import QuickAction from '../components/home/QuickAction';

export default function Dashboard() {
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const apiBase = pickApiBaseUrl(); // đã cache
    const hasApi = !!apiBase;

    const [q, setQ] = useState('');
    const qDebounced = useDebounced(q, 350);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [items, setItems] = useState<Contact[]>([]);
    const [openNew, setOpenNew] = useState(false);
    const [totalContacts, setTotalContacts] = useState<number>(0);

    const fetchList = useCallback(async () => {
        if (!hasApi || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await listRecentContacts(qDebounced, token);
            setItems(res.data || []);
            setTotalContacts(Number((res as any)?.total) || (res.data?.length ?? 0));
        } catch (e: any) {
            setError(e?.message || 'Failed to load contacts');
        } finally {
            setLoading(false);
        }
    }, [qDebounced, token, hasApi]);

    useEffect(() => {
        void fetchList();
    }, [fetchList]);

    const filtered = useMemo(() => {
        if (!qDebounced.trim()) return items;
        const t = qDebounced.toLowerCase();
        return items.filter(
            (c) =>
                c.name?.toLowerCase().includes(t) ||
                c.email?.toLowerCase().includes(t) ||
                c.company?.toLowerCase().includes(t) ||
                c.phone?.toLowerCase().includes(t),
        );
    }, [items, qDebounced]);

    const companyCount = useMemo(() => {
        const set = new Set(items.map((c) => (c.company || '').trim().toLowerCase()).filter(Boolean));
        return set.size;
    }, [items]);

    const handleCreated = (c: Contact) => {
        setItems((prev) => [c, ...prev.filter((x) => x.id !== c.id)].slice(0, 4));
        // cần đồng bộ tuyệt đối -> void fetchList();
    };

    const handleUpdated = (updated: Contact) => {
        setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    };

    function exportCSV() {
        const rows = [
            ['Name', 'Company', 'Email', 'Phone', 'Address', 'Notes'],
            ...filtered.map((c) => [
                c.name,
                c.company || '',
                c.email || '',
                c.phone || '',
                c.address || '',
                (c.notes || '').replace(/\n/g, ' '),
            ]),
        ];
        const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile top bar */}
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" onNewContact={() => setOpenNew(true)} />
            </div>

            {/* Desktop sidebar (fixed) */}
            <AppNav variant="sidebar" onNewContact={() => setOpenNew(true)} />

            {/* MAIN */}
            <main className="px-4 py-6 md:ml-64 md:px-8">
                {/* Header hành động */}
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold">Home</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative w-[min(480px,80vw)]">
                            <input
                                placeholder="Search contacts…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                className="w-full rounded-2xl border bg-white px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-slate-300"
                            />
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔎
                            </span>
                        </div>
                        <button
                            onClick={() => setOpenNew(true)}
                            className="hidden sm:inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                        >
                            + New contact
                        </button>
                    </div>
                </div>

                {/* Hàng thống kê */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard icon={<span>👥</span>} label="Contacts" value={totalContacts} hint="Recently added show below" />
                    <StatCard icon={<span>🏢</span>} label="Companies" value={companyCount} hint="Unique organizations" />
                    <StatCard icon={<span>⏰</span>} label="Reminders due" value={0} hint="Connect your reminders" />
                </div>

                {/* Lưới 2 cột: trái Recent, phải Quick actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT */}
                    <div className="lg:col-span-8">
                        <Section title="Recent contacts">
                            {error && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                            {hasApi && token ? (
                                loading ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
                                        ))}
                                    </div>
                                ) : filtered.length ? (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        {filtered.map((c) => (
                                            <ContactCard key={c.id} c={c} token={token} onUpdated={handleUpdated} />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="No contacts yet" subtitle="Click “Add” to create your first contact" />
                                )
                            ) : null}
                        </Section>
                    </div>

                    {/* RIGHT */}
                    <div className="lg:col-span-4">
                        <Section title="Quick actions">
                            <div className="grid grid-cols-1 gap-3">
                                <QuickAction
                                    icon={<span>📷</span>}
                                    label="Scan business card (mobile)"
                                    onClick={() => alert('Open mobile scanner')}
                                />
                                <QuickAction icon={<span>➕</span>} label="Add new contact" onClick={() => setOpenNew(true)} />
                                <QuickAction icon={<span>⬇️</span>} label="Export CSV" onClick={exportCSV} />
                            </div>
                        </Section>
                    </div>
                </div>
            </main>

            <NewContactModal open={openNew} onClose={() => setOpenNew(false)} onCreated={handleCreated} token={token} />
        </div>
    );
}
