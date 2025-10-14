'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

function stripHashLower(s: string) {
    return s.replace(/^#+/, '').trim().toLowerCase();
}

export default function SelectContactsModal({
    open,
    onClose,
    token,
    filters,
    title = 'Select contacts',
    confirmLabel = 'Confirm',
    onConfirm,
    canAddTags,
    onAddTags,
    focusTag,
    allowToggleWithWithout,
    onAddToFocusTag,
    refreshKey,

    /** loại bỏ các contact này khỏi list (ví dụ đã chọn sẵn) */
    excludeIds = [],
    /** bật chế độ "without reminder" + điều kiện */
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

    // fetch state
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // action state (confirm / add to tag)
    const [actionBusy, setActionBusy] = useState(false);

    const [q, setQ] = useState(filters.q || '');
    const [sort, setSort] = useState<Filters['sort']>(filters.sort || 'name');

    // selection (giữ xuyên trang)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // With / Without #tag
    const [viewWithout, setViewWithout] = useState(false);

    // mini notice (không có nút)
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 2200);
        return () => clearTimeout(t);
    }, [notice]);

    // ===== Helper: cập nhật local list ngay lập tức (không đụng total/last) =====
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

    // reset khi mở modal
    useEffect(() => {
        if (!open) return;
        setPage(1);
        setSelected(new Set());
        setQ(filters.q || '');
        setSort(filters.sort || 'name');
        setViewWithout(false);
    }, [open]); // eslint-disable-line

    // đổi With/Without hoặc đổi tag => reset trang + selection
    useEffect(() => {
        setPage(1);
        setSelected(new Set());
    }, [viewWithout, focusTag?.id]);

    // tải danh sách
    async function fetchList() {
        if (!open) return;
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

            setData({
                items: res.data || [],
                total: res.total ?? 0,
                last: res.last_page ?? 1,
            });
        } catch (e: any) {
            setErr(e?.message || 'Failed to load');
        } finally {
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
            setNotice({ type: 'success', msg: 'Done.' });
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
            setNotice({ type: 'success', msg: `Added to #${focusTag.name}` });
        } catch (e: any) {
            setNotice({ type: 'error', msg: e?.message || 'Failed' });
        } finally {
            setActionBusy(false);
        }
    }

    if (!open) return null;

    const disableAll = loading || actionBusy;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop (chặn đóng khi đang chạy action/fetch) */}
            <div
                className={`absolute inset-0 bg-black/30 ${disableAll ? 'cursor-wait' : ''}`}
                onClick={() => {
                    if (!disableAll) onClose();
                }}
            />

            {/* modal */}
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="relative w-full max-w-[1100px] rounded-2xl bg-white shadow-xl flex h-[78vh] min-h-[560px] max-h-[78vh] flex-col overflow-hidden">
                    {/* Top loading bar */}
                    {(loading || actionBusy) && (
                        <div className="absolute left-0 top-0 h-1 w-full overflow-hidden">
                            <div className="h-full w-1/3 animate-[loading_1.2s_linear_infinite] bg-slate-900" />
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-base font-semibold">{title}</h3>

                        {focusTag && allowToggleWithWithout && (
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={disableAll}
                                    className={`rounded-full px-3 py-1 text-sm ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${!viewWithout
                                            ? 'bg-slate-900 text-white ring-slate-900'
                                            : 'bg-white text-slate-700 ring-slate-300'
                                        }`}
                                    onClick={() => setViewWithout(false)}
                                >
                                    With #{focusTag.name}
                                </button>
                                <button
                                    disabled={disableAll}
                                    className={`rounded-full px-3 py-1 text-sm ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${viewWithout
                                            ? 'bg-slate-900 text-white ring-slate-900'
                                            : 'bg-white text-slate-700 ring-slate-300'
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
                            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={disableAll ? 'Please wait…' : 'Close'}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 border-b px-4 py-2 text-sm">
                        <span className="text-slate-500">Filter:</span>
                        <div className="relative w-[260px]">
                            <input
                                value={q}
                                onChange={(e) => {
                                    setPage(1);
                                    setQ(e.target.value);
                                }}
                                placeholder="q: (none)"
                                className="w-full rounded-md border bg-white px-3 py-1.5 pl-8 outline-none disabled:opacity-50"
                                disabled={disableAll}
                            />
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                                🔎
                            </span>
                        </div>

                        <span className="ml-2 text-slate-500">sort:</span>
                        <select
                            value={sort}
                            onChange={(e) => {
                                setSort(e.target.value as any);
                                setPage(1);
                            }}
                            className="rounded-md border bg-white px-2 py-1 disabled:opacity-50"
                            disabled={disableAll}
                        >
                            <option value="name">name</option>
                            <option value="-name">-name</option>
                            <option value="-id">-id</option>
                            <option value="id">id</option>
                        </select>

                        {err && (
                            <span className="ml-auto rounded-md bg-rose-50 px-2 py-1 text-rose-700">{err}</span>
                        )}
                    </div>

                    {/* Body */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-4">
                        <div className="mx-auto my-3 w-full rounded-xl border">
                            <div className="sticky top-0 z-10 grid grid-cols-[40px_1fr_1fr_1fr] items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all on this page"
                                        disabled={loading || pageIds.length === 0}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                        checked={allPageChecked && !loading}
                                        ref={(el) => {
                                            if (el) el.indeterminate = !loading && somePageChecked;
                                        }}
                                        onChange={(e) => toggleAllCurrentPage(e.target.checked)}
                                    />
                                </div>
                                <div>Name & Company</div>
                                <div>Email</div>
                                <div>Phone</div>
                            </div>

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
                                                        disabled={disableAll}
                                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    {!data.items.length && !loading && (
                                        <li className="p-6 text-center text-sm text-slate-500">No results</li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="flex flex-col gap-2 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        {/* pager */}
                        <div className="order-2 flex items-center gap-2 sm:order-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={disableAll || page <= 1}
                                className="rounded-md border px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                «
                            </button>
                            <span className="text-sm">
                                Page {page} / {Math.max(1, data.last)}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(data.last || 1, p + 1))}
                                disabled={disableAll || page >= data.last}
                                className="rounded-md border px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                »
                            </button>

                            <span className="ml-4 text-sm text-slate-600">
                                Selected: <b>{selected.size}</b> / {data.total}
                            </span>
                            <button
                                onClick={() => toggleAllCurrentPage(true)}
                                disabled={disableAll || !pageIds.length}
                                className="ml-2 rounded-md border px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Select this page"
                            >
                                Select this page ({pageIds.length})
                            </button>
                            <button
                                onClick={() => setSelected(new Set())}
                                disabled={disableAll || selected.size === 0}
                                className="rounded-md border px-2 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Clear selected
                            </button>
                        </div>

                        {/* actions (KHÔNG thêm nút mới) */}
                        <div className="order-1 flex flex-col items-stretch gap-2 sm:order-2 sm:flex-row sm:items-center">
                            {focusTag && allowToggleWithWithout && viewWithout && onAddToFocusTag && (
                                <button
                                    onClick={handleAddToFocusTag}
                                    disabled={disableAll || selected.size === 0}
                                    className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionBusy ? 'Adding…' : `Add selected to #${focusTag.name}`}
                                </button>
                            )}

                            {onConfirm && !(focusTag && allowToggleWithWithout && viewWithout) && (
                                <button
                                    onClick={handleConfirm}
                                    disabled={disableAll || selected.size === 0}
                                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionBusy ? 'Processing…' : confirmLabel}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Floating notice (không có nút) */}
                    {notice && (
                        <div className="pointer-events-none absolute bottom-3 right-3">
                            <div
                                className={`pointer-events-auto rounded-lg px-3 py-2 text-sm shadow ${notice.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                                    }`}
                            >
                                {notice.msg}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* keyframes for loading bar */}
            <style>{`
                @keyframes loading {
                    0%   { transform: translateX(-120%); }
                    50%  { transform: translateX(20%); }
                    100% { transform: translateX(120%); }
                }
            `}</style>
        </div>
    );
}
