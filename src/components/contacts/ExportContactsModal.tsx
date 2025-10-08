'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Contact } from '../../services/contacts';
import { listContacts, downloadContactsExport } from '../../services/contacts';


type ExportFilters = {
    q?: string;
    sort?: 'name' | '-name' | 'id' | '-id';
    tag_ids?: number[];
    tags?: string[];
    tag_mode?: 'any' | 'all';
};

type Props = {
    open: boolean;
    onClose: () => void;
    token: string;
    filters: ExportFilters;
};

type PageData = { items: Contact[]; total: number; last: number };

export default function ExportContactsModal({ open, onClose, token, filters }: Props) {
    const [page, setPage] = useState(1);
    const [per] = useState(20);
    const [data, setData] = useState<PageData>({ items: [], total: 0, last: 1 });
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

    // các id đã chọn (giữ xuyên trang)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // mở modal thì reset
    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSelected(new Set());
    }, [open]);

    // tải danh sách
    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoading(true);
        setErr(null);

        listContacts(
            {
                q: filters.q,
                page,
                per_page: per,
                sort: filters.sort,
                tag_ids: filters.tag_ids,
                tags: filters.tags,
                tag_mode: filters.tag_mode,
            },
            token
        )
            .then((res) => {
                if (!active) return;
                setData({ items: res.data, total: res.total, last: res.last_page });
            })
            .catch((e) => setErr(e?.message || 'Failed to load'))
            .finally(() => setLoading(false));

        return () => {
            active = false;
        };
    }, [open, filters.q, filters.sort, filters.tag_ids, filters.tags, filters.tag_mode, page, per, token]);

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

    async function doExportSelected() {
        if (!selected.size) return;
        setBusy(true);
        setErr(null);
        try {
            await downloadContactsExport({ ...filters, format, ids: Array.from(selected) }, token);
            onClose();
        } catch (e: any) {
            setErr(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    async function doExportCurrentPage() {
        if (!pageIds.length) return;
        setBusy(true);
        setErr(null);
        try {
            await downloadContactsExport({ ...filters, format, ids: pageIds }, token);
            onClose();
        } catch (e: any) {
            setErr(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    async function doExportAll() {
        setBusy(true);
        setErr(null);
        try {
            await downloadContactsExport({ ...filters, format }, token);
            onClose();
        } catch (e: any) {
            setErr(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
            {/* container center */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-5xl">
                    {/* card: flex column, body cuộn */}
                    <div className="flex max-h-[90svh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        {/* Header (cố định) */}
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <h3 className="text-base font-semibold">Export contacts</h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">Format:</span>
                                <select
                                    value={format}
                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
                                    className="rounded-md border px-2 py-1 text-sm text-slate-700"
                                >
                                    <option value="xlsx">.xlsx</option>
                                    <option value="csv">.csv</option>
                                </select>
                                <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Filters summary (cố định, tùy chọn) */}
                        <div className="flex items-center gap-3 border-b px-4 py-2 text-xs text-slate-500">
                            <span>Filter:</span>
                            {filters.q ? (
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-700 ring-1 ring-slate-200">
                                    q: “{filters.q}”
                                </span>
                            ) : (
                                <span className="rounded bg-slate-50 px-2 py-0.5">q: (none)</span>
                            )}
                            <span className="rounded bg-slate-50 px-2 py-0.5">sort: {filters.sort || '-id'}</span>
                        </div>

                        {/* Body (cuộn) */}
                        <div className="flex-1 overflow-auto px-4">
                            <div className="mx-auto my-3 w-full rounded-xl border">
                                {/* table header (sticky trong vùng cuộn) */}
                                <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr_1fr_1fr] items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all on this page"
                                            checked={allPageChecked}
                                            ref={(el) => {
                                                if (!el) return;
                                                el.indeterminate = somePageChecked;
                                            }}
                                            onChange={(e) => toggleAllCurrentPage(e.target.checked)}
                                        />
                                    </div>
                                    <div>Name & Company</div>
                                    <div>Email</div>
                                    <div>Phone</div>
                                </div>

                                {/* rows */}
                                {loading ? (
                                    <div className="p-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                                        ))}
                                    </div>
                                ) : (
                                    <ul>
                                        {data.items.map((c) => {
                                            const checked = selected.has(c.id);
                                            return (
                                                <li
                                                    key={c.id}
                                                    className="grid grid-cols-[40px_1fr_1fr_1fr] items-center gap-2 px-3 py-2 hover:bg-slate-50"
                                                >
                                                    <div>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => toggleOne(c.id, e.target.checked)}
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium">{c.name}</div>
                                                        <div className="truncate text-xs text-slate-500">
                                                            {c.company || c.job_title || '—'}
                                                        </div>
                                                    </div>
                                                    <div className="truncate text-xs">{c.email || '—'}</div>
                                                    <div className="truncate text-xs">{c.phone || '—'}</div>
                                                </li>
                                            );
                                        })}
                                        {!data.items.length && (
                                            <li className="p-6 text-center text-sm text-slate-500">No results</li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Footer (cố định) */}
                        <div
                            className="flex flex-col gap-2 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {/* pager (giữa ở mobile, trái ở desktop) */}
                            <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
                                <NumberPager current={page} total={Math.max(1, data.last)} onPage={setPage} />
                            </div>

                            {/* actions */}
                            <div className="order-1 flex flex-col items-stretch gap-2 sm:order-2 sm:flex-row sm:items-center">
                                <div className="text-xs text-slate-600">
                                    Selected: <span className="font-semibold">{selected.size}</span> / {data.total}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={doExportCurrentPage}
                                        disabled={busy || loading || !pageIds.length}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Export this page {pageIds.length ? `(${pageIds.length})` : ''}
                                    </button>
                                    <button
                                        onClick={doExportAll}
                                        disabled={busy || loading || data.total === 0}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        Export all ({data.total})
                                    </button>
                                    <button
                                        onClick={doExportSelected}
                                        disabled={busy || loading || selected.size === 0}
                                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        Export selected {selected.size ? `(${selected.size})` : ''}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {err && <div className="mx-4 mb-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======= Local pager ======= */
function getVisiblePages(current: number, total: number, max = 7): (number | '...')[] {
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);
    const pages: (number | '...')[] = [];
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
        if (end < total - 1) pages.push('...');
        pages.push(total);
    }
    return pages;
}

function NumberPager({
    current,
    total,
    onPage,
}: {
    current: number;
    total: number;
    onPage: (p: number) => void;
}) {
    const pages = getVisiblePages(current, total, 7);
    const btn =
        'px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed';

    return (
        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <button onClick={() => onPage(1)} disabled={current <= 1} className={btn} aria-label="First">
                «
            </button>
            <button
                onClick={() => onPage(Math.max(1, current - 1))}
                disabled={current <= 1}
                className={btn}
                aria-label="Prev"
            >
                ‹
            </button>

            <div className="flex items-center divide-x divide-slate-200">
                {pages.map((n, i) =>
                    n === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-slate-500">
                            …
                        </span>
                    ) : (
                        <button
                            key={`p-${n}`}
                            aria-current={n === current ? 'page' : undefined}
                            onClick={() => n !== current && onPage(n)}
                            className={`${btn} ${n === current ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-400' : 'hover:bg-slate-50'
                                }`}
                        >
                            {n}
                        </button>
                    )
                )}
            </div>

            <button
                onClick={() => onPage(Math.min(total, current + 1))}
                disabled={current >= total}
                className={btn}
                aria-label="Next"
            >
                ›
            </button>
            <button onClick={() => onPage(total)} disabled={current >= total} className={btn} aria-label="Last">
                »
            </button>
        </div>
    );
}
