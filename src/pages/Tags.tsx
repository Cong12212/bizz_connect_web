'use client';

import { useEffect, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import useDebounced from '../hooks/useDebounced';
import { listTags, createTag, renameTag, deleteTag, type Tag } from '../services/tags';

export default function TagsPage() {
    const reduxToken = useAppSelector(s => s.auth.token);
    const token = reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');
    const [q, setQ] = useState('');
    const qDebounced = useDebounced(q, 300);

    const [items, setItems] = useState<Tag[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        setLoading(true); setErr(null);
        listTags(qDebounced, token)
            .then(res => setItems(res.data))
            .catch(e => setErr(e?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [qDebounced, token]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden"><AppNav variant="mobile" /></div>
            <AppNav variant="sidebar" />

            <main className="px-4 py-6 md:ml-64 md:px-8">
                <h1 className="mb-4 text-xl font-semibold">Tags</h1>

                <div className="mb-4 flex items-center gap-2">
                    <input value={q} onChange={e => setQ(e.target.value)}
                        placeholder="Search tags…" className="w-full max-w-md rounded-xl border bg-white px-3 py-2" />
                </div>

                <div className="mb-4 rounded-xl border bg-white p-3">
                    <div className="flex items-center gap-2">
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New tag name"
                            className="flex-1 rounded-xl border px-3 py-2" />
                        <button
                            onClick={async () => {
                                if (!newName.trim()) return;
                                const t = await createTag(newName.trim(), null, token);
                                setItems(prev => [t, ...prev]);
                                setNewName('');
                            }}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-white">Add
                        </button>
                    </div>
                </div>

                {err && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{err}</div>}

                {loading ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />)}
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {items.map(t => (
                            <li key={t.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2">
                                <input
                                    defaultValue={t.name}
                                    className="w-full max-w-[70%] rounded-md border px-2 py-1"
                                    onBlur={async (e) => {
                                        const name = e.currentTarget.value.trim();
                                        if (name && name !== t.name) {
                                            const nt = await renameTag(t.id, name, token);
                                            setItems(prev => prev.map(x => x.id === t.id ? nt : x));
                                        }
                                    }}
                                />
                                <button
                                    onClick={async () => {
                                        if (!confirm('Delete this tag?')) return;
                                        await deleteTag(t.id, token);
                                        setItems(prev => prev.filter(x => x.id !== t.id));
                                    }}
                                    className="rounded-md bg-white px-2 py-1 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}
