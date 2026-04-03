'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    listContacts,
    type Contact,
} from '@/services/contacts';
import type { Tag } from '@/services/tags';

type Filters = {
    q?: string;
    sort?: 'name' | '-name' | 'id' | '-id';
    tag_ids?: number[];
    tags?: string[];
    tag_mode?: 'any' | 'all';
};

export default function SelectContactsModal({
    open,
    onClose,
    token,
    filters,
    title = 'Select contacts',
    confirmLabel = 'Confirm',
    onConfirm,
    focusTag,
    allowToggleWithWithout,
    onAddToFocusTag,
    refreshKey,
    excludeIds = [],
    withoutReminder,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    filters: Filters;
    title?: string;
    confirmLabel?: string;
    onConfirm?: (ids: number[]) => Promise<void>;
    canAddTags?: boolean;
    onAddTags?: (ids: number[], names: string[]) => Promise<void>;
    focusTag?: Tag;
    allowToggleWithWithout?: boolean;
    onAddToFocusTag?: (ids: number[], tag: Tag) => Promise<void>;
    refreshKey?: number;
    excludeIds?: number[];
    withoutReminder?: {
        enabled: boolean;
        status?: 'pending' | 'done' | 'skipped' | 'cancelled';
        after?: string;
        before?: string;
    };
}) {
    const [page, setPage] = useState(1);
    const [per] = useState(20);
    const [data, setData] = useState<{ items: Contact[]; total: number; last: number }>({
        items: [],
        total: 0,
        last: 1,
    });

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [actionBusy, setActionBusy] = useState(false);

    const [q, setQ] = useState(filters.q || '');
    const [sort, setSort] = useState<Filters['sort']>(filters.sort || 'name');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [viewWithout, setViewWithout] = useState(false);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const fetchSeq = useRef(0);

    // Auto-hide notice after 2.2s
    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 2200);
        return () => clearTimeout(t);
    }, [notice]);

    // Update local list immediately (without touching total/last)
    function dropIds(ids: number[]) {
        if (!ids.length) return;
        setData((d) => ({
            ...d,
            items: d.items.filter((c) => !ids.includes(c.id)),
        }));
        setSelected((prev) => {
            const n = new Set(prev);
            ids.forEach((id) => n.delete(id));
            return n;
        });
    }

    // Reset when modal opens
    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSelected(new Set());
        setQ(filters.q || '');
        setSort(filters.sort || 'name');
        setViewWithout(false);
    }, [open]); // eslint-disable-line

    // Reset page + selection when switching With/Without or changing tag
    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [viewWithout, focusTag?.id]);

    // Fetch contact list
    async function fetchList() {
        if (!open) return;
        const currentSeq = ++fetchSeq.current;
        setLoading(true);
        setErr(null);

        try {
            const base: any = { q, sort, page, per_page: per, exclude_ids: excludeIds };

            let res: any;
            if (withoutReminder?.enabled) {
                res = await listContacts(
                    {
                        ...base,
                        without_reminder: true,
                        rem_status: withoutReminder.status,
                        rem_after: withoutReminder.after,
                        rem_before: withoutReminder.before,
                    },
                    token,
                );
            } else if (focusTag && allowToggleWithWithout) {
                res = await listContacts(
                    viewWithout
                        ? { ...base, without_tag: focusTag.id ?? focusTag.name }
                        : { ...base, tags: [focusTag.name], tag_mode: 'all' },
                    token,
                );
            } else {
                res = await listContacts({ ...base, ...filters }, token);
            }

            if (currentSeq !== fetchSeq.current) return;

            setData({
                items: res.data || [],
                total: res.total ?? 0,
                last: res.last_page ?? 1,
            });
        } catch (e: any) {
            if (currentSeq !== fetchSeq.current) return;
            setErr(e?.message || 'Failed to load');
        } finally {
            if (currentSeq !== fetchSeq.current) return;
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        open,
        q,
        sort,
        page,
        per,
        token,
        JSON.stringify(filters),
        focusTag?.id,
        focusTag?.name,
        allowToggleWithWithout,
        viewWithout,
        refreshKey,
        withoutReminder?.enabled,
        withoutReminder?.status,
        withoutReminder?.after,
        withoutReminder?.before,
        excludeIds.join(','),
    ]);

    const pageIds = useMemo(() => data.items.map((i) => i.id), [data.items]);
    const allPageChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const somePageChecked = pageIds.some((id) => selected.has(id)) && !allPageChecked;

    function toggleOne(id: number, checked: boolean) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    }
    function toggleAllCurrentPage(checked: boolean) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (checked) pageIds.forEach((id) => next.add(id));
            else pageIds.forEach((id) => next.delete(id));
            return next;
        });
    }

    async function handleConfirm() {
        if (!onConfirm) return;
        const ids = Array.from(selected);
        if (!ids.length) return;
        setActionBusy(true);
        try {
            await onConfirm(ids);
            if (focusTag && allowToggleWithWithout && !viewWithout) {
                dropIds(ids);
            }
            setNotice({ type: 'success', msg: 'Action completed successfully' });
        } catch (e: any) {
            setNotice({ type: 'error', msg: e?.message || 'Action failed' });
        } finally {
            setActionBusy(false);
        }
    }

    async function handleAddToFocusTag() {
        if (!focusTag || !onAddToFocusTag) return;
        const ids = Array.from(selected);
        if (ids.length === 0) return;

        setActionBusy(true);
        try {
            await onAddToFocusTag(ids, focusTag);
            setSelected(new Set());
            if (allowToggleWithWithout && viewWithout) {
                dropIds(ids);
            }
            setNotice({ type: 'success', msg: `Added ${ids.length} contact(s) to #${focusTag.name}` });
        } catch (e: any) {
            setNotice({ type: 'error', msg: e?.message || 'Failed to add contacts' });
        } finally {
            setActionBusy(false);
        }
    }

    if (!open) return null;

    const disableAll = loading || actionBusy;

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop with blur */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity ${disableAll ? 'cursor-wait' : ''}`}
                onClick={() => {
                    if (!disableAll) onClose();
                }}
            />

            {/* Modal */}
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="relative w-full max-w-[1100px] rounded-2xl bg-white shadow-2xl flex h-[82vh] min-h-[600px] max-h-[82vh] flex-col overflow-hidden">
                    {/* Top loading bar */}
                    {(loading || actionBusy) && (
                        <div className="absolute left-0 top-0 h-1 w-full overflow-hidden bg-slate-100">
                            <div className="h-full w-1/3 animate-[loading_1.2s_linear_infinite] bg-gradient-to-r from-blue-500 to-purple-500" />
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-white px-6 py-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {loading ? 'Loading...' : `${data.total} contact${data.total !== 1 ? 's' : ''} available`}
                            </p>
                        </div>

                        {/* With/Without toggle buttons */}
                        {focusTag && allowToggleWithWithout && (
                            <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm border">
                                <button
                                    disabled={disableAll}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${!viewWithout
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setViewWithout(false)}
                                >
                                    With #{focusTag.name}
                                </button>
                                <button
                                    disabled={disableAll}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${viewWithout
                                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    onClick={() => setViewWithout(true)}
                                >
                                    Without #{focusTag.name}
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => !disableAll && onClose()}
                            disabled={disableAll}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={disableAll ? 'Please wait…' : 'Close'}
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-4 border-b bg-slate-50 px-6 py-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">🔍 Search:</span>
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={(e) => {
                                        setPage(1);
                                        setQ(e.target.value);
                                    }}
                                    placeholder="Search by name, email, company..."
                                    className="w-[320px] rounded-lg border border-slate-300 bg-white px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:bg-slate-100"
                                    disabled={disableAll}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium">⬍ Sort:</span>
                            <select
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value as any);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                                disabled={disableAll}
                            >
                                <option value="name">A → Z</option>
                                <option value="-name">Z → A</option>
                                <option value="-id">Newest first</option>
                                <option value="id">Oldest first</option>
                            </select>
                        </div>

                        {err && (
                            <div className="ml-auto rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{err}</span>
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
                        <div className="mx-auto w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                                <div className="flex items-center w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all on this page"
                                        disabled={loading || pageIds.length === 0}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        checked={allPageChecked && !loading}
                                        ref={(el) => {
                                            if (el) el.indeterminate = !loading && somePageChecked;
                                        }}
                                        onChange={(e) => toggleAllCurrentPage(e.target.checked)}
                                    />
                                </div>
                                <div className="flex-1 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Contact
                                </div>
                                <div className="w-48 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Email
                                </div>
                                <div className="w-36 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Phone
                                </div>
                            </div>

                            {/* Table Body */}
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                                            <div className="w-12 h-12 animate-pulse rounded-full bg-slate-200" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                                                <div className="h-3 w-1/4 animate-pulse rounded bg-slate-200" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <ul>
                                    {data.items.map((c) => {
                                        const checked = selected.has(c.id);
                                        return (
                                            <li
                                                key={c.id}
                                                className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors border-b last:border-b-0 ${checked ? 'bg-blue-50' : ''}`}
                                            >
                                                <div className="w-10">
                                                    <input
                                                        type="checkbox"
                                                        disabled={disableAll}
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        checked={checked}
                                                        onChange={(e) => toggleOne(c.id, e.target.checked)}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* Avatar */}
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                                        {initials(c.name)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-sm text-slate-900 truncate">
                                                            {c.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500 truncate">
                                                            {c.company || c.job_title || '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-48 text-sm text-slate-600 truncate">
                                                    {c.email || '—'}
                                                </div>
                                                <div className="w-36 text-sm text-slate-600 truncate">
                                                    {c.phone || '—'}
                                                </div>
                                            </li>
                                        );
                                    })}
                                    {!data.items.length && !loading && (
                                        <li className="p-12 text-center">
                                            <div className="text-5xl mb-3">🔍</div>
                                            <div className="text-base font-medium text-slate-900">No contacts found</div>
                                            <div className="text-sm text-slate-500 mt-1">
                                                Try adjusting your search or filters
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex flex-col gap-3 border-t bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                    >
                        {/* Left: Pagination & Selection info */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(1)}
                                    disabled={disableAll || page <= 1}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    title="First page"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={disableAll || page <= 1}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                >
                                    ‹
                                </button>
                                <span className="text-sm font-medium text-slate-700 px-2">
                                    Page {page} of {Math.max(1, data.last)}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(data.last || 1, p + 1))}
                                    disabled={disableAll || page >= data.last}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setPage(data.last || 1)}
                                    disabled={disableAll || page >= data.last}
                                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                                    title="Last page"
                                >
                                    »
                                </button>
                            </div>

                            <div className="h-6 w-px bg-slate-300" />

                            <span className="text-sm text-slate-600">
                                Selected: <span className="font-bold text-blue-600">{selected.size}</span> / {data.total}
                            </span>

                            <button
                                onClick={() => toggleAllCurrentPage(true)}
                                disabled={disableAll || !pageIds.length || allPageChecked}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100 transition-colors"
                            >
                                Select page ({pageIds.length})
                            </button>
                            <button
                                onClick={() => setSelected(new Set())}
                                disabled={disableAll || selected.size === 0}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Right: Action buttons */}
                        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                            {focusTag && allowToggleWithWithout && viewWithout && onAddToFocusTag && (
                                <button
                                    onClick={handleAddToFocusTag}
                                    disabled={disableAll || selected.size === 0}
                                    className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                                >
                                    {actionBusy ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Adding...
                                        </span>
                                    ) : (
                                        `Add selected to #${focusTag.name}`
                                    )}
                                </button>
                            )}

                            {onConfirm && !(focusTag && allowToggleWithWithout && viewWithout) && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={disableAll || selected.size === 0}
                                    className="rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
                                >
                                    {actionBusy ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        confirmLabel
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Floating notice */}
                    {notice && (
                        <div className="pointer-events-none absolute bottom-6 right-6 z-50">
                            <div
                                className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-[slideIn_0.3s_ease-out] ${notice.type === 'success'
                                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                                    : 'bg-gradient-to-r from-rose-500 to-red-500 text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                        {notice.type === 'success' ? '✓' : '⚠️'}
                                    </span>
                                    <span>{notice.msg}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes loading {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}

// Helper: get initials from name
function initials(name?: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('');
}
