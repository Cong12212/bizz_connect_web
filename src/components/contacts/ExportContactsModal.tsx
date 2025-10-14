'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Contact } from '../../services/contacts';
import { listContacts, downloadContactsExport } from '../../services/contacts';
import { Spinner, useToast } from '../ui/Toast';

type ExportFilters = {
    q?: string;
    sort?: 'name' | '-name' | 'id' | '-id';
    tag_ids?: number[];
    tags?: string[];
    tag_mode?: 'any' | 'all';
};

type BaseProps = {
    open: boolean;
    onClose: () => void;
    token: string;
    filters: ExportFilters;
};

type Props = BaseProps & {
    mode?: 'export' | 'pick';
    confirmLabel?: string;
    onConfirm?: (ids: number[]) => void | Promise<void>;
};

type PageData = { items: Contact[]; total: number; last: number };

export default function ExportContactsModal({
    open,
    onClose,
    token,
    filters,
    mode = 'export',
    confirmLabel = 'Confirm',
    onConfirm,
}: Props) {
    const toast = useToast();
    const isPick = mode === 'pick';

    const [page, setPage] = useState(1);
    const [per] = useState(20);
    const [data, setData] = useState<PageData>({ items: [], total: 0, last: 1 });
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

    // selected ids (persist across pages)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // reset when modal opens
    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSelected(new Set());
    }, [open]);

    // load list
    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoading(true);

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
            .catch((e) => {
                const msg = e?.message || 'Failed to load contacts';
                toast.error(msg);
            })
            .finally(() => setLoading(false));

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // ====== Export actions ======
    async function doExportSelected() {
        if (!selected.size) return;
        setBusy(true);
        try {
            await downloadContactsExport({ ...filters, format, ids: Array.from(selected) }, token);
            toast.success(`Exported ${selected.size} contact(s).`);
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    async function doExportCurrentPage() {
        if (!pageIds.length) return;
        setBusy(true);
        try {
            await downloadContactsExport({ ...filters, format, ids: pageIds }, token);
            toast.success(`Exported ${pageIds.length} on this page.`);
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    async function doExportAll() {
        setBusy(true);
        try {
            await downloadContactsExport({ ...filters, format }, token);
            toast.success('Exported all results.');
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Export failed');
        } finally {
            setBusy(false);
        }
    }

    // ====== Pick actions ======
    async function doConfirmPick() {
        if (!isPick || !onConfirm || !selected.size) return;
        setBusy(true);
        try {
            await onConfirm(Array.from(selected));
            toast.success(`Selected ${selected.size} contact(s).`);
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Action failed');
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />

            {/* container */}
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
                <div className="w-full max-w-6xl">
                    <div className="relative flex max-h-[90svh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
                        {/* busy overlay */}
                        {busy && (
                            <div className="absolute inset-0 z-20 grid place-items-center bg-white/60 backdrop-blur-[2px]">
                                <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-slate-700 shadow">
                                    <Spinner />
                                    <span>Working…</span>
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="relative">
                            <div className="h-20 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700" />
                            <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6">
                                <div className="flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow ring-1 ring-black/5">
                                    <h3 className="text-base font-semibold text-slate-900">
                                        {isPick ? 'Select contacts' : 'Export contacts'}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        {!isPick && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">Format</span>
                                                <select
                                                    value={format}
                                                    onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
                                                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                                                >
                                                    <option value="xlsx">.xlsx</option>
                                                    <option value="csv">.csv</option>
                                                </select>
                                            </div>
                                        )}
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                                            aria-label="Close"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters summary */}
                        <div className="mt-8 flex items-center gap-2 border-b px-4 py-2 text-xs sm:px-6">
                            <Badge label="Filter" muted />
                            {filters.q ? (
                                <Pill>q: “{filters.q}”</Pill>
                            ) : (
                                <Pill muted>q: (none)</Pill>
                            )}
                            <Pill>sort: {filters.sort || '-id'}</Pill>
                            {filters.tags?.length ? <Pill>tags: {filters.tags.join(', ')}</Pill> : null}
                            {filters.tag_ids?.length ? <Pill>tag_ids: {filters.tag_ids.length}</Pill> : null}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-auto px-3 pb-3 pt-2 sm:px-6">
                            <div className="mx-auto my-2 w-full overflow-hidden rounded-2xl border bg-white">
                                {/* table header */}
                                <TableHeader
                                    allPageChecked={allPageChecked}
                                    somePageChecked={somePageChecked}
                                    onToggleAll={toggleAllCurrentPage}
                                />

                                {/* rows */}
                                {loading ? (
                                    <div className="p-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <div key={i} className="mb-2 h-14 animate-pulse rounded-xl bg-slate-200" />
                                        ))}
                                    </div>
                                ) : data.items.length ? (
                                    <ul className="divide-y">
                                        {data.items.map((c) => {
                                            const checked = selected.has(c.id);
                                            return (
                                                <li
                                                    key={c.id}
                                                    className="grid grid-cols-[46px_minmax(240px,1.2fr)_1fr_1fr] items-center gap-2 px-3 py-2 hover:bg-slate-50 sm:px-4"
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => toggleOne(c.id, e.target.checked)}
                                                            aria-label={`Select ${c.name}`}
                                                        />
                                                    </div>

                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar name={c.name} />
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-medium">{c.name}</div>
                                                            <div className="truncate text-xs text-slate-500">
                                                                {c.company || c.job_title || '—'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="truncate text-xs">{c.email || '—'}</div>
                                                    <div className="truncate text-xs">{c.phone || '—'}</div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="p-10 text-center text-slate-500">
                                        <div className="mb-2 text-3xl">🗂️</div>
                                        <div className="font-medium">No results</div>
                                        <div className="text-sm">Try adjusting your filters.</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            className="flex flex-col gap-3 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                        >
                            {/* pager */}
                            <div className="order-2 flex justify-center sm:order-1 sm:justify-start">
                                <NumberPager current={page} total={Math.max(1, data.last)} onPage={setPage} />
                            </div>

                            {/* actions */}
                            <div className="order-1 flex flex-col items-stretch gap-2 sm:order-2 sm:flex-row sm:items-center">
                                <div className="text-xs text-slate-600">
                                    Selected: <span className="font-semibold">{selected.size}</span> / {data.total}
                                </div>

                                {isPick ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={doConfirmPick}
                                            disabled={busy || loading || selected.size === 0}
                                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {confirmLabel} {selected.size ? `(${selected.size})` : ''}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={doExportCurrentPage}
                                            disabled={busy || loading || !pageIds.length}
                                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Export this page {pageIds.length ? `(${pageIds.length})` : ''}
                                        </button>
                                        <button
                                            onClick={doExportAll}
                                            disabled={busy || loading || data.total === 0}
                                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                        >
                                            Export all ({data.total})
                                        </button>
                                        <button
                                            onClick={doExportSelected}
                                            disabled={busy || loading || selected.size === 0}
                                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            Export selected {selected.size ? `(${selected.size})` : ''}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ======= UI bits ======= */
function TableHeader({
    allPageChecked,
    somePageChecked,
    onToggleAll,
}: {
    allPageChecked: boolean;
    somePageChecked: boolean;
    onToggleAll: (v: boolean) => void;
}) {
    const ref = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = somePageChecked;
    }, [somePageChecked]);

    return (
        <div className="sticky top-0 z-10 grid grid-cols-[46px_minmax(240px,1.2fr)_1fr_1fr] items-center gap-2 border-b bg-slate-50/95 px-3 py-2 text-xs font-medium text-slate-600 backdrop-blur sm:px-4">
            <div className="flex items-center">
                <input
                    ref={ref}
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allPageChecked}
                    onChange={(e) => onToggleAll(e.target.checked)}
                />
            </div>
            <div>Name & Company</div>
            <div>Email</div>
            <div>Phone</div>
        </div>
    );
}

function Avatar({ name }: { name?: string | null }) {
    const txt = (name || '?')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('');
    return (
        <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {txt || '?'}
        </div>
    );
}

function Pill({
    children,
    muted,
}: {
    children: React.ReactNode;
    muted?: boolean;
}) {
    return (
        <span
            className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ring-1',
                muted ? 'bg-slate-50 text-slate-500 ring-slate-200' : 'bg-slate-100 text-slate-700 ring-slate-200',
            ].join(' ')}
        >
            {children}
        </span>
    );
}

function Badge({ label, muted = false }: { label: string; muted?: boolean }) {
    return (
        <span
            className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                muted ? 'bg-slate-50 text-slate-500 ring-1 ring-slate-200' : 'bg-slate-900 text-white',
            ].join(' ')}
        >
            {label}
        </span>
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
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push('...'); pages.push(total); }
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
            <button onClick={() => onPage(1)} disabled={current <= 1} className={btn} aria-label="First">«</button>
            <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current <= 1} className={btn} aria-label="Prev">‹</button>

            <div className="flex items-center divide-x divide-slate-200">
                {pages.map((n, i) =>
                    n === '...' ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-slate-500">…</span>
                    ) : (
                        <button
                            key={`p-${n}`}
                            aria-current={n === current ? 'page' : undefined}
                            onClick={() => n !== current && onPage(n)}
                            className={`${btn} ${n === current ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-400' : 'hover:bg-slate-50'}`}
                        >
                            {n}
                        </button>
                    )
                )}
            </div>

            <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current >= total} className={btn} aria-label="Next">›</button>
            <button onClick={() => onPage(total)} disabled={current >= total} className={btn} aria-label="Last">»</button>
        </div>
    );
}
