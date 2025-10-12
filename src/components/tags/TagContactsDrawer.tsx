'use client';

import { useEffect, useState } from 'react';
import { listContacts, type Contact } from '../../services/contacts';

function getVisiblePages(current: number, total: number, max = 7): (number | '...')[] {
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);
    const pages: (number | '...')[] = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
    return pages;
}

function NumberPager({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
    const pages = getVisiblePages(current, total, 7);
    const btn = 'px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed';
    return (
        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <button onClick={() => onPage(1)} disabled={current <= 1} className={btn}>«</button>
            <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current <= 1} className={btn}>‹</button>
            <div className="flex items-center divide-x divide-slate-200">
                {pages.map((n, i) => n === '...' ? (
                    <span key={i} className="px-2 text-sm text-slate-500">…</span>
                ) : (
                    <button key={n} onClick={() => n !== current && onPage(n)}
                        aria-current={n === current ? 'page' : undefined}
                        className={`${btn} ${n === current ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-400' : 'hover:bg-slate-50'}`}
                    >{n}</button>
                ))}
            </div>
            <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current >= total} className={btn}>›</button>
            <button onClick={() => onPage(total)} disabled={current >= total} className={btn}>»</button>
        </div>
    );
}

export default function TagContactsDrawer({
    open, onClose, token, tagId, tagName,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    tagId: number | null;
    tagName: string;
}) {
    const [page, setPage] = useState(1);
    const [per] = useState(20);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [data, setData] = useState<{ items: Contact[]; total: number; last: number }>({ items: [], total: 0, last: 1 });

    useEffect(() => { if (open) { setPage(1); } }, [open, tagId]);

    useEffect(() => {
        if (!open || !tagId) return;
        let ok = true;
        setLoading(true); setErr(null);
        listContacts({ page, per_page: per, tag_ids: [tagId] }, token)
            .then(res => {
                if (!ok) return;
                setData({ items: res.data, total: res.total, last: res.last_page });
            })
            .catch(e => setErr(e?.message || 'Failed to load'))
            .finally(() => setLoading(false));
        return () => { ok = false; };
    }, [open, tagId, page, per, token]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col">
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h3 className="text-base font-semibold">Contacts with #{tagName}</h3>
                    <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                </div>

                <div className="flex-1 overflow-auto p-3">
                    {err && <div className="mb-2 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />)
                    ) : (
                        <ul>
                            {data.items.map(c => (
                                <li key={c.id} className="rounded-lg border p-3 mb-2">
                                    <div className="text-sm font-medium">{c.name}</div>
                                    <div className="text-xs text-slate-500">{c.company || c.job_title || c.email || c.phone || '—'}</div>
                                </li>
                            ))}
                            {!data.items.length && <li className="p-6 text-center text-sm text-slate-500">No contacts</li>}
                        </ul>
                    )}
                </div>

                <div className="border-t p-3 flex justify-center">
                    <NumberPager current={page} total={Math.max(1, data.last)} onPage={setPage} />
                </div>
            </div>
        </div>
    );
}
