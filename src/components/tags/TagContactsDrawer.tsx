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
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer panel */}
            <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-white px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                            Contacts with <span className="text-blue-600">#{tagName}</span>
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {loading ? 'Loading...' : `${data.total} contact${data.total !== 1 ? 's' : ''} found`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-50 p-4">
                    {err && (
                        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">⚠️</span>
                                <div>
                                    <div className="font-medium">Error loading contacts</div>
                                    <div className="text-xs mt-1">{err}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />
                            ))}
                        </div>
                    ) : data.items.length > 0 ? (
                        <ul className="space-y-3">
                            {data.items.map(c => (
                                <li key={c.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="p-4 flex items-start gap-4">
                                        {/* Avatar */}
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-base">
                                            {initials(c.name)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                                                        {c.name}
                                                    </h4>
                                                    {(c.job_title || c.company) && (
                                                        <p className="text-xs text-slate-600 mt-0.5 truncate">
                                                            {[c.job_title, c.company].filter(Boolean).join(' • ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact details */}
                                            <div className="mt-2 space-y-1">
                                                {c.email && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>📧</span>
                                                        <span className="truncate">{c.email}</span>
                                                    </div>
                                                )}
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>📱</span>
                                                        <span>{c.phone}</span>
                                                    </div>
                                                )}
                                                {!c.email && !c.phone && (
                                                    <div className="text-xs text-slate-400 italic">No contact info</div>
                                                )}
                                            </div>

                                            {/* Tags */}
                                            {Array.isArray(c.tags) && c.tags.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {c.tags.map((t) => (
                                                        <span
                                                            key={t.id}
                                                            className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200"
                                                        >
                                                            #{t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="text-6xl mb-4">🔍</div>
                            <h4 className="text-base font-medium text-slate-900 mb-1">No contacts found</h4>
                            <p className="text-sm text-slate-500 text-center max-w-sm">
                                This tag hasn&apos;t been applied to any contacts yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer with pagination */}
                {!loading && data.items.length > 0 && (
                    <div className="border-t bg-white p-4 flex justify-center">
                        <NumberPager current={page} total={Math.max(1, data.last)} onPage={setPage} />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to get initials from name
function initials(name?: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('');
}
