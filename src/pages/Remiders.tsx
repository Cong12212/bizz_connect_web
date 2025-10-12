// src/app/reminders/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import useDebounced from '../hooks/useDebounced';
import SelectContactsModal from '../components/contacts/SelectContactsModal';
import ReminderFormModal from '../components/reminders/ReminderFormModal';
import type { Reminder } from '../services/reminders';


import {
    listReminderEdges,
    detachReminderContact,
    updateReminder,
    bulkUpdateReminderStatus,
    bulkDeleteReminders,
    type ReminderEdge,
    type ReminderStatus,
} from '../services/reminders';


type Group = {
    id: number;
    title: string;
    note?: string | null;
    due_at: string | null;
    status: ReminderStatus;
    contacts: { id: number; name: string; company?: string | null; is_primary: boolean }[];
};

const fmtLocal = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString() : '—';

export default function RemindersPage() {
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    // bộ lọc
    const [status, setStatus] = useState<'' | ReminderStatus>('');
    const [overdue, setOverdue] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [contactId, setContactId] = useState<number | undefined>(undefined);

    // phân trang (vẫn dựa theo pivot; FE sẽ gộp lại khi hiển thị)
    const [page, setPage] = useState(1);
    const [reloadKey, setReloadKey] = useState(0);
    const [perPage, setPerPage] = useState(20);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // dữ liệu gốc (edges) + gộp theo reminder
    const [edges, setEdges] = useState<ReminderEdge[]>([]);
    const [lastPage, setLastPage] = useState(1);

    // selection theo "reminder id" (đơn giản cho bulk)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // mở modal chọn contact để lọc
    const [pickContactOpen, setPickContactOpen] = useState(false);

    // trạng thái expand chips theo reminder
    const [expanded, setExpanded] = useState<Record<number, boolean>>({});

    const debKey = useDebounced(
        JSON.stringify({ status, overdue, from, to, contactId, page, perPage }),
        200
    );

    const [formOpen, setFormOpen] =
        useState<false | { mode: 'create' } | { mode: 'edit'; row: Reminder }>(false);


    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr(null);

        listReminderEdges(
            {
                status: status || undefined,
                overdue: overdue || undefined,
                after: from ? new Date(from) : undefined,
                before: to ? new Date(to) : undefined,
                contact_id: contactId,
                page,
                per_page: perPage,
            },
            token
        )
            .then((res) => {
                if (!alive) return;
                setEdges(res.data || []);
                setLastPage(res.last_page || 1);
            })
            .catch((e) => setErr(e?.message || 'Failed to load reminders'))
            .finally(() => setLoading(false));

        return () => {
            alive = false;
        };
    }, [debKey, token, reloadKey]);

    // ======= GỘP THEO REMINDER =======
    const groups: Group[] = useMemo(() => {
        const map = new Map<number, Group>();
        for (const e of edges) {
            let g = map.get(e.reminder_id);
            if (!g) {
                g = {
                    id: e.reminder_id,
                    title: e.title,
                    note: e.note ?? null,
                    due_at: e.due_at,
                    status: e.status,
                    contacts: [],
                };
                map.set(e.reminder_id, g);
            } else {
                // cập nhật meta nếu có thay đổi mới hơn (hiếm khi cần)
                if (e.due_at !== g.due_at) g.due_at = e.due_at;
                if (e.status !== g.status) g.status = e.status;
                if (e.title !== g.title) g.title = e.title;
                if ((e.note ?? null) !== g.note) g.note = e.note ?? null;
            }
            g.contacts.push({
                id: e.contact_id,
                name: e.contact_name,
                company: e.contact_company,
                is_primary: !!e.is_primary,
            });
        }
        // sắp xếp chip: primary lên trước
        const arr = Array.from(map.values());
        arr.forEach((g) =>
            g.contacts.sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1))
        );
        return arr;
    }, [edges]);

    // page helpers
    const pageIds = groups.map((g) => g.id);
    const allPageChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
    const somePageChecked = pageIds.some((id) => selected.has(id)) && !allPageChecked;

    function toggleGroup(id: number, checked: boolean) {
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
            pageIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
            return next;
        });
    }

    // ======= Hành động =======
    async function doBulkStatus(s: ReminderStatus) {
        const ids = Array.from(selected);
        if (!ids.length) return;
        await bulkUpdateReminderStatus(ids, s, token);
        // cập nhật giao diện
        setEdges((es) => es.map((e) => (ids.includes(e.reminder_id) ? { ...e, status: s } : e)));
        setSelected(new Set());
    }

    async function doBulkDelete() {
        const ids = Array.from(selected);
        if (!ids.length) return;
        if (!confirm(`Delete ${ids.length} reminder(s)?`)) return;
        await bulkDeleteReminders(ids, token);
        setEdges((es) => es.filter((e) => !ids.includes(e.reminder_id)));
        setSelected(new Set());
    }

    async function markDoneOne(reminderId: number) {
        await updateReminder(reminderId, { status: 'done' }, token);
        setEdges((es) => es.map((e) => (e.reminder_id === reminderId ? { ...e, status: 'done' } : e)));
    }


    async function detachOne(reminderId: number, contactId: number) {
        await detachReminderContact(reminderId, contactId, token);
        setEdges((es) =>
            es.filter((e) => !(e.reminder_id === reminderId && e.contact_id === contactId))
        );
    }

    function StatusBadge({ s }: { s: ReminderStatus }) {
        const cls =
            s === 'pending'
                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                : s === 'done'
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                    : s === 'skipped'
                        ? 'bg-slate-100 text-slate-700 ring-slate-200'
                        : 'bg-rose-50 text-rose-700 ring-rose-200';
        return (
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs ring-1 ${cls}`}>{s}</span>
        );
    }

    function openEdit(g: Group) {
        const firstContactId = g.contacts[0]?.id ?? 0; // lấy contact đầu làm mặc định
        const row: Reminder = {
            id: g.id,
            contact_id: firstContactId,
            owner_user_id: 0,
            title: g.title,
            note: g.note ?? null,
            due_at: g.due_at,
            status: g.status,
            channel: 'app',
            external_event_id: null,
            created_at: '',
            updated_at: '',
            deleted_at: null,
        };
        setFormOpen({ mode: 'edit', row });
    }

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="md:ml-64 h-screen overflow-hidden p-4">
                <div className="mx-auto max-w-6xl">
                    {/* ====== Toolbar lọc ====== */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-lg font-semibold">Reminders</h1>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as any);
                                setPage(1);
                            }}
                            className="rounded-md border bg-white px-3 py-2 text-sm"
                        >
                            <option value="">All status</option>
                            <option value="pending">pending</option>
                            <option value="done">done</option>
                            <option value="skipped">skipped</option>
                            <option value="cancelled">cancelled</option>
                        </select>

                        <label className="ml-2 inline-flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={overdue}
                                onChange={(e) => {
                                    setOverdue(e.target.checked);
                                    setPage(1);
                                }}
                            />
                            Overdue only
                        </label>

                        <div className="ml-2 flex items-center gap-2 text-sm">
                            <span>From</span>
                            <input
                                type="datetime-local"
                                value={from}
                                onChange={(e) => {
                                    setFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-md border px-2 py-1"
                            />
                            <span>To</span>
                            <input
                                type="datetime-local"
                                value={to}
                                onChange={(e) => {
                                    setTo(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-md border px-2 py-1"
                            />
                        </div>

                        <button
                            onClick={() => setPickContactOpen(true)}
                            className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
                        >
                            {contactId ? `Contact #${contactId}` : 'Filter by contact'}
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={() => setFormOpen({ mode: 'create' })}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                            >
                                New reminder
                            </button>
                        </div>
                        {contactId && (
                            <button
                                onClick={() => setContactId(undefined)}
                                className="rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                                clear
                            </button>
                        )}
                    </div>

                    {err && (
                        <div className="mb-2 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>
                    )}

                    {/* ====== Bảng gọn: 1 dòng / reminder ====== */}
                    <div className="overflow-hidden rounded-xl border bg-white">
                        <div className="grid grid-cols-[40px_1.3fr_1.4fr_1fr_140px_210px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
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
                            <div>Title</div>
                            <div>Contacts</div>
                            <div>Due at</div>
                            <div>Status</div>
                            <div>Actions</div>
                        </div>

                        {loading ? (
                            <div className="p-3">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                                ))}
                            </div>
                        ) : groups.length ? (
                            <ul>
                                {groups.map((g) => {
                                    const checked = selected.has(g.id);
                                    const isOpen = !!expanded[g.id];
                                    const maxInline = 3;
                                    const shown = isOpen ? g.contacts : g.contacts.slice(0, maxInline);
                                    const hiddenCount = Math.max(0, g.contacts.length - shown.length);

                                    return (
                                        <li
                                            key={g.id}
                                            className="grid grid-cols-[40px_1.3fr_1.4fr_1fr_140px_210px] items-center gap-2 px-3 py-2"
                                        >
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    disabled={loading}
                                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                                    checked={checked}
                                                    onChange={(e) => toggleGroup(g.id, e.target.checked)}
                                                />
                                            </div>

                                            {/* Title + note ngắn */}
                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{g.title}</div>
                                                {g.note && (
                                                    <div className="truncate text-xs text-slate-500">{g.note}</div>
                                                )}
                                            </div>

                                            {/* Chips contacts gọn, có expand */}
                                            <div className="flex flex-wrap items-center gap-1">
                                                {shown.map((c) => (
                                                    <span
                                                        key={c.id}
                                                        className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-full border px-2 py-0.5 text-xs"
                                                        title={`${c.name}${c.company ? ' · ' + c.company : ''}`}
                                                    >
                                                        <span className="truncate">
                                                            {c.name}
                                                            {c.company ? ` · ${c.company}` : ''}
                                                        </span>
                                                    </span>
                                                ))}
                                                {hiddenCount > 0 && (
                                                    <button
                                                        className="rounded-full border px-2 py-0.5 text-xs hover:bg-slate-50"
                                                        onClick={() => setExpanded((ex) => ({ ...ex, [g.id]: !isOpen }))}
                                                    >
                                                        {isOpen ? 'Show less' : `+${hiddenCount} more`}
                                                    </button>
                                                )}
                                            </div>


                                            <div className="truncate text-sm">{fmtLocal(g.due_at)}</div>

                                            <div className="text-xs">
                                                <StatusBadge s={g.status} />
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                                    onClick={() => openEdit(g)}
                                                >
                                                    Edit
                                                </button>

                                                {g.status !== 'done' && (
                                                    <button
                                                        className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                                        onClick={() => markDoneOne(g.id)}
                                                    >
                                                        Mark done
                                                    </button>
                                                )}

                                                <button
                                                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                                                    onClick={async () => {
                                                        if (!confirm('Delete this reminder (all contacts)?')) return;
                                                        await bulkDeleteReminders([g.id], token);
                                                        setEdges((es) => es.filter((e) => e.reminder_id !== g.id));
                                                    }}
                                                >
                                                    Delete reminder
                                                </button>
                                            </div>

                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500">No reminders</div>
                        )}

                        {/* Footer/Pager */}
                        <div className="flex flex-col gap-2 border-t p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="order-2 flex items-center gap-2 sm:order-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span>
                                    Page {page} / {Math.max(1, lastPage)}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(lastPage || 1, p + 1))}
                                    disabled={page >= lastPage}
                                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                                >
                                    Next
                                </button>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(parseInt(e.target.value, 10));
                                        setPage(1);
                                    }}
                                    className="ml-2 rounded-md border px-2 py-1"
                                >
                                    {[10, 20, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}/page
                                        </option>
                                    ))}
                                </select>
                                <span className="ml-4">
                                    Selected: <b>{selected.size}</b>
                                </span>
                                <button
                                    onClick={() => toggleAllCurrentPage(true)}
                                    disabled={!pageIds.length}
                                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                                    title="Select this page"
                                >
                                    Select this page
                                </button>
                                <button
                                    onClick={() => setSelected(new Set())}
                                    disabled={selected.size === 0}
                                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                                >
                                    Clear selected
                                </button>
                            </div>

                            <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2">
                                <button
                                    onClick={() => doBulkStatus('done')}
                                    disabled={selected.size === 0}
                                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Mark done (bulk)
                                </button>
                                <button
                                    onClick={() => doBulkStatus('pending')}
                                    disabled={selected.size === 0}
                                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Set pending (bulk)
                                </button>
                                <button
                                    onClick={doBulkDelete}
                                    disabled={selected.size === 0}
                                    className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                                >
                                    Delete selected reminders
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Picker lọc theo contact */}
            <SelectContactsModal
                open={pickContactOpen}
                onClose={() => setPickContactOpen(false)}
                token={token}
                filters={{ q: '', sort: 'name' }}
                title="Pick a contact"
                confirmLabel="Use this contact"
                onConfirm={async (ids) => {
                    setContactId(ids[0]);
                    setPickContactOpen(false);
                    setPage(1);
                }}
            />
            {formOpen && (
                <ReminderFormModal
                    open={!!formOpen}
                    onClose={() => setFormOpen(false)}
                    token={token}
                    mode={formOpen.mode}
                    row={formOpen.mode === 'edit' ? formOpen.row : undefined}
                    onSaved={(saved) => {
                        setFormOpen(false);
                        if (formOpen.mode === 'edit') {
                            // cập nhật lại list (edges) cho reminder đã sửa
                            setEdges((es) =>
                                es.map((e) =>
                                    e.reminder_id === saved.id
                                        ? {
                                            ...e,
                                            title: saved.title,
                                            note: saved.note ?? null,
                                            due_at: saved.due_at,
                                            status: saved.status,
                                            channel: saved.channel,
                                        }
                                        : e
                                )
                            );
                        } else {
                            // create: refetch nhanh cho chắc (vì saved có thể có nhiều contact)
                            setReloadKey((k) => k + 1);
                        }
                    }}
                />
            )}

        </div>
    );
}
