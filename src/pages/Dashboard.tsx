// src/pages/Dashboard.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    const navigate = useNavigate();

    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const apiBase = pickApiBaseUrl();
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

    const openContact = (id: number) => navigate(`/contacts/${id}`);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile top bar */}
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>

            {/* Desktop sidebar (fixed) */}
            <AppNav variant="sidebar" />

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
                    {/* Ô Contacts → click để đi tới /contacts */}
                    <button
                        type="button"
                        onClick={() => navigate('/contacts')}
                        className="text-left"
                        title="View all contacts"
                    >
                        <StatCard
                            icon={<span>👥</span>}
                            label="Contacts"
                            value={totalContacts}
                            hint="Click to view all contacts"
                        />
                    </button>

                    <StatCard icon={<span>⏰</span>} label="Reminders due" value={0} hint="Connect your reminders" />
                </div>

                {/* Lưới 2 cột: trái Recent, phải Quick actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT */}
                    <div className="lg:col-span-8">
                        {/* Tiêu đề + link View all */}
                        <div className="mb-2 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Recent contacts</h2>
                            <Link
                                to="/contacts"
                                className="text-sm text-sky-600 hover:underline"
                                title="Go to all contacts"
                            >
                                View all →
                            </Link>
                        </div>

                        <Section title="">
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
                                            // Bọc ContactCard trong button để điều hướng khi click toàn bộ card
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => openContact(c.id)}
                                                className="text-left"
                                                title={`Open ${c.name}`}
                                            >
                                                <ContactCard c={c} token={token} onUpdated={handleUpdated} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title="No contacts yet" subtitle="Click “Add” to create your first contact" />
                                )
                            ) : null}
                        </Section>
                    </div>

                </div>
            </main>

            <NewContactModal open={openNew} onClose={() => setOpenNew(false)} onCreated={handleCreated} token={token} />
        </div>
    );
}
