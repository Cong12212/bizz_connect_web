// src/pages/Contacts.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import useDebounced from '../hooks/useDebounced';
import { useAppSelector } from '../utils/hooks';
import { listContacts, type Contact, deleteContact } from '../services/contacts';
import ContactCard from '../components/contacts/ContactCard';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/ui/Pagination';
import NewContactModal from '../components/contacts/NewContactModal';

export default function ContactsPage() {
    const reduxToken = useAppSelector(s => s.auth.token);
    const token = reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const [q, setQ] = useState('');
    const qDebounced = useDebounced(q, 300);
    const [page, setPage] = useState(1);
    const [per] = useState(12);
    const [sort, setSort] = useState<'name' | '-name' | 'id' | '-id'>('-id');

    const [data, setData] = useState<{ items: Contact[]; total: number; last: number }>({ items: [], total: 0, last: 1 });
    const [loading, setLoading] = useState(true);
    const [openNew, setOpenNew] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        listContacts({ q: qDebounced, page, per_page: per, sort }, token)
            .then(res => { if (active) setData({ items: res.data, total: res.total, last: res.last_page }); })
            .catch(e => setError(e?.message || 'Failed to load'))
            .finally(() => setLoading(false));
        return () => { active = false; };
    }, [qDebounced, page, per, sort, token]);

    const list = useMemo(() => data.items, [data.items]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden"><AppNav variant="mobile" onNewContact={() => setOpenNew(true)} /></div>
            <AppNav variant="sidebar" onNewContact={() => setOpenNew(true)} />

            <main className="px-4 py-6 md:ml-64 md:px-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold">Contacts</h1>
                    <div className="flex items-center gap-2">
                        <div className="relative w-[min(520px,80vw)]">
                            <input
                                value={q}
                                onChange={e => { setPage(1); setQ(e.target.value); }}
                                placeholder="Search name, email, phone…"
                                className="w-full rounded-2xl border bg-white px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-slate-300"
                            />
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                        </div>
                        <select value={sort} onChange={e => setSort(e.target.value as any)}
                            className="rounded-xl border bg-white px-3 py-2">
                            <option value="-id">Newest</option>
                            <option value="name">Name A→Z</option>
                            <option value="-name">Name Z→A</option>
                            <option value="id">Oldest</option>
                        </select>
                        <button onClick={() => setOpenNew(true)} className="hidden sm:inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                            + New
                        </button>
                    </div>
                </div>

                {error && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                {loading ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />)}
                    </div>
                ) : list.length ? (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {list.map(c => (
                                <div key={c.id} className="relative group">
                                    <ContactCard
                                        c={c}
                                        token={token}
                                        onUpdated={(updated) =>
                                            setData(d => ({ ...d, items: d.items.map(x => (x.id === updated.id ? updated : x)) }))
                                        }
                                    />
                                    <div className="absolute right-2 top-2 hidden gap-2 group-hover:flex">
                                        <button
                                            onClick={async () => {
                                                if (!confirm('Delete this contact?')) return;
                                                await deleteContact(c.id, token);
                                                setData(d => ({ ...d, items: d.items.filter(x => x.id !== c.id) }));
                                            }}
                                            className="rounded-md bg-white/80 px-2 py-1 text-xs text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination page={page} lastPage={data.last} onPage={setPage} />
                    </>
                ) : (
                    <EmptyState title="No results" subtitle="Try another keyword or add new contact." />
                )}
            </main>

            <NewContactModal open={openNew} onClose={() => setOpenNew(false)} onCreated={() => setOpenNew(false)} token={token} />
        </div>
    );
}
