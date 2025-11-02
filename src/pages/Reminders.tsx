'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useToast } from '../components/ui/Toast';

import {
    Clock,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Edit2,
    Trash2,
    Check,
    FileText,
    UserMinus
} from 'lucide-react';

type Group = {
    id: number;
    title: string;
    note?: string | null;
    due_at: string | null;
    status: ReminderStatus;
    contacts: { id: number; name: string; company?: string | null; is_primary: boolean }[];
};

function formatUTCAsIs(isoString?: string | null): string {
    if (!isoString) return '—';
    const match = String(isoString).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return String(isoString);

    const [, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year}, ${hour}:${minute}`;
}

/* ---------- Small helpers ---------- */
function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

function StatusBadge({ status }: { status: ReminderStatus }) {
    const config = {
        pending: { icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', label: 'Pending' },
        done: { icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', label: 'Done' },
        skipped: { icon: MinusCircle, bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', label: 'Skipped' },
        cancelled: { icon: XCircle, bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', label: 'Cancelled' },
    }[status] || { icon: Clock, bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', label: status };

    const Icon = config.icon;

    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1',
            config.bg,
            config.text,
            config.ring
        )}>
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
}



/** A tiny popover used for "+N more" */
function MorePopover({
    open,
    onClose,
    anchorClassName,
    children,
}: {
    open: boolean;
    onClose: () => void;
    anchorClassName?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement | null>(null);

    // close on click outside
    useEffect(() => {
        if (!open) return;
        function onDoc(e: MouseEvent) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target as Node)) onClose();
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, onClose]);

    return (
        <div className={cn('relative inline-block', anchorClassName)}>
            {open && (
                <div
                    ref={ref}
                    className="absolute z-40 mt-1 w-[320px] rounded-xl border bg-white shadow-xl ring-1 ring-slate-200"
                    onMouseLeave={onClose}
                >
                    <div className="max-h-[280px] overflow-y-auto p-2">{children}</div>
                </div>
            )}
        </div>
    );
}

export default function RemindersPage() {
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const toast = useToast();

    // filters
    const [status, setStatus] = useState<'' | ReminderStatus>('');
    const [overdue] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [contactId, setContactId] = useState<number | undefined>(undefined);

    // paging (server returns edges; FE groups by reminder)
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [reloadKey, setReloadKey] = useState(0);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // raw edges + pagination
    const [edges, setEdges] = useState<ReminderEdge[]>([]);
    const [lastPage, setLastPage] = useState(1);

    // selection by reminder id (for bulk)
    const [selected, setSelected] = useState<Set<number>>(new Set());

    // contact picker modal
    const [pickContactOpen, setPickContactOpen] = useState(false);

    // which reminder's "+N more" is open
    const [openMoreOf, setOpenMoreOf] = useState<number | null>(null);

    // bulk action busy
    const [bulkBusy, setBulkBusy] = useState(false);

    const debKey = useDebounced(
        JSON.stringify({ status, overdue, from, to, contactId, page, perPage }),
        250,
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
            token,
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

    // ======= GROUP BY REMINDER =======
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
        const arr = Array.from(map.values());
        arr.forEach((g) =>
            g.contacts.sort((a, b) => (a.is_primary === b.is_primary ? 0 : a.is_primary ? -1 : 1)),
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

    function edgesFromReminder(r: Reminder): ReminderEdge[] {
        const contacts = (r as any).contacts || [];
        return contacts.map((c: any) => ({
            reminder_id: r.id,
            title: r.title,
            note: r.note ?? null,
            due_at: r.due_at,
            status: r.status,
            channel: r.channel,
            contact_id: c.id,
            contact_name: c.name,
            contact_company: c.company ?? null,
            is_primary: c.pivot?.is_primary ? 1 : 0,
        }));
    }

    // ======= ACTIONS =======
    async function doBulkStatus(s: ReminderStatus) {
        const ids = Array.from(selected);
        if (!ids.length) return;
        setBulkBusy(true);
        try {
            await bulkUpdateReminderStatus(ids, s, token);
            setEdges((es) => es.map((e) => (ids.includes(e.reminder_id) ? { ...e, status: s } : e)));
            setSelected(new Set());
            toast.success(`Updated ${ids.length} reminder(s) to "${s}".`);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update reminders');
        } finally {
            setBulkBusy(false);
        }
    }

    async function doBulkDelete() {
        const ids = Array.from(selected);
        if (!ids.length) return;
        if (!confirm(`Delete ${ids.length} reminder(s)?`)) return;
        setBulkBusy(true);
        try {
            await bulkDeleteReminders(ids, token);
            setEdges((es) => es.filter((e) => !ids.includes(e.reminder_id)));
            setSelected(new Set());
            toast.success(`Deleted ${ids.length} reminder(s).`);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to delete reminders');
        } finally {
            setBulkBusy(false);
        }
    }

    async function markDoneOne(reminderId: number) {
        try {
            await updateReminder(reminderId, { status: 'done' }, token);
            setEdges((es) => es.map((e) => (e.reminder_id === reminderId ? { ...e, status: 'done' } : e)));
            toast.success('Marked as done.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update status');
        }
    }

    async function detachOne(reminderId: number, contactId: number) {
        try {
            await detachReminderContact(reminderId, contactId, token);
            setEdges((es) => es.filter((e) => !(e.reminder_id === reminderId && e.contact_id === contactId)));
            toast.success('Contact detached from reminder.');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to detach contact');
        }
    }

    function openEdit(g: Group) {
        const firstContactId = g.contacts[0]?.id ?? 0;
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
                    {/* Toolbar */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                        <h1 className="text-lg font-semibold">Reminders</h1>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value as any);
                                setPage(1);
                            }}
                            className="h-10 rounded-md border bg-white px-3 py-2 text-sm"
                        >
                            <option value="">All status</option>
                            <option value="pending">pending</option>
                            <option value="done">done</option>
                            <option value="skipped">skipped</option>
                            <option value="cancelled">cancelled</option>
                        </select>

                        <div className="ml-2 flex items-center gap-2 text-sm">
                            <span>From</span>
                            <input
                                type="datetime-local"
                                value={from}
                                onChange={(e) => {
                                    setFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="h-10 rounded-md border px-3 py-2 text-sm"
                            />
                            <span>To</span>
                            <input
                                type="datetime-local"
                                value={to}
                                onChange={(e) => {
                                    setTo(e.target.value);
                                    setPage(1);
                                }}
                                className="h-10 rounded-md border px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={() => setFormOpen({ mode: 'create' })}
                                className="h-10 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
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

                    {err && <div className="mb-2 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>}

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border bg-white">
                        <div className="grid grid-cols-[40px_1.3fr_1.4fr_1fr_140px_210px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    aria-label="Select all on this page"
                                    disabled={loading || pageIds.length === 0}
                                    className="disabled:cursor-not-allowed disabled:opacity-50"
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
                                    const maxInline = 3;
                                    const shown = g.contacts.slice(0, maxInline);
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
                                                    className="disabled:cursor-not-allowed disabled:opacity-50"
                                                    checked={checked}
                                                    onChange={(e) => toggleGroup(g.id, e.target.checked)}
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <div className="truncate text-sm font-medium">{g.title}</div>
                                                {g.note && <div className="truncate text-xs text-slate-500">{g.note}</div>}
                                            </div>

                                            {/* Contacts cell */}
                                            <div className="relative flex flex-wrap items-center gap-1">
                                                {shown.map((c) => (
                                                    <span
                                                        key={c.id}
                                                        className={cn(
                                                            'inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-md border px-2.5 py-1 text-xs font-medium',
                                                            c.is_primary
                                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                                : 'border-slate-300 bg-white text-slate-700',
                                                        )}
                                                        title={`${c.name}${c.company ? ' · ' + c.company : ''}${c.is_primary ? ' · primary' : ''}`}
                                                    >
                                                        <span className="truncate">
                                                            {c.name}
                                                            {c.company ? ` · ${c.company}` : ''}
                                                        </span>
                                                        <button
                                                            className={cn(
                                                                'ml-0.5 rounded-md px-1 text-sm transition-colors',
                                                                c.is_primary
                                                                    ? 'hover:bg-slate-800'
                                                                    : 'hover:bg-rose-50 text-rose-600'
                                                            )}
                                                            title="Remove contact from this reminder"
                                                            onClick={() => detachOne(g.id, c.id)}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}

                                                {hiddenCount > 0 && (
                                                    <MorePopover
                                                        open={openMoreOf === g.id}
                                                        onClose={() => setOpenMoreOf(null)}
                                                        anchorClassName="ml-1"
                                                    >
                                                        {/* Popover content: full list with scroll */}
                                                        <ul className="space-y-1">
                                                            {g.contacts.map((c) => (
                                                                <li
                                                                    key={c.id}
                                                                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-slate-50"
                                                                    title={`${c.name}${c.company ? ' · ' + c.company : ''}`}
                                                                >
                                                                    <div className="min-w-0">
                                                                        <div className="truncate text-sm font-medium">
                                                                            {c.name}
                                                                            {c.company ? ` · ${c.company}` : ''}
                                                                        </div>
                                                                        {c.is_primary && (
                                                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                                                                                Primary
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                                                                        onClick={() => detachOne(g.id, c.id)}
                                                                    >
                                                                        <UserMinus className="h-3 w-3" />
                                                                        Remove
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </MorePopover>
                                                )}

                                                {hiddenCount > 0 && (
                                                    <button
                                                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                        onClick={() => setOpenMoreOf((cur) => (cur === g.id ? null : g.id))}
                                                        aria-haspopup="dialog"
                                                        aria-expanded={openMoreOf === g.id}
                                                        title={`${hiddenCount} more contact(s)`}
                                                    >
                                                        +{hiddenCount} more
                                                    </button>
                                                )}
                                            </div>

                                            <div className="truncate text-sm">{formatUTCAsIs(g.due_at)}</div>

                                            <div className="flex items-center justify-center">
                                                <StatusBadge status={g.status} />
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                                    onClick={() => openEdit(g)}
                                                    title="Edit reminder"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                    Edit
                                                </button>

                                                {g.status !== 'done' && (
                                                    <button
                                                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors"
                                                        onClick={() => markDoneOne(g.id)}
                                                        title="Mark as done"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Done
                                                    </button>
                                                )}

                                                <button
                                                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition-colors"
                                                    onClick={async () => {
                                                        if (!confirm('Delete this reminder (all contacts)?')) return;
                                                        try {
                                                            await bulkDeleteReminders([g.id], token);
                                                            setEdges((es) => es.filter((e) => e.reminder_id !== g.id));
                                                            toast.success('Reminder deleted.');
                                                        } catch (e: any) {
                                                            toast.error(e?.message || 'Failed to delete reminder');
                                                        }
                                                    }}
                                                    title="Delete reminder"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
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
                        <div className="flex flex-col gap-2 border-t bg-slate-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="order-2 flex flex-wrap items-center gap-2 sm:order-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Prev
                                </button>
                                <span className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium">
                                    Page {page} / {Math.max(1, lastPage)}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(lastPage || 1, p + 1))}
                                    disabled={page >= lastPage}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(parseInt(e.target.value, 10));
                                        setPage(1);
                                    }}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    {[10, 20, 50, 100].map((n) => (
                                        <option key={n} value={n}>
                                            {n}/page
                                        </option>
                                    ))}
                                </select>
                                <span className="ml-2 text-sm text-slate-600">
                                    Selected: <b>{selected.size}</b>
                                </span>
                                <button
                                    onClick={() => toggleAllCurrentPage(true)}
                                    disabled={!pageIds.length}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Select this page"
                                >
                                    Select this page
                                </button>
                                <button
                                    onClick={() => setSelected(new Set())}
                                    disabled={selected.size === 0}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Clear selected
                                </button>
                            </div>

                            <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2">
                                <button
                                    onClick={() => doBulkStatus('done')}
                                    disabled={selected.size === 0 || bulkBusy}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    {bulkBusy ? 'Working…' : 'Mark done'}
                                </button>
                                <button
                                    onClick={() => doBulkStatus('pending')}
                                    disabled={selected.size === 0 || bulkBusy}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Clock className="h-4 w-4" />
                                    Set pending
                                </button>
                                <button
                                    onClick={doBulkDelete}
                                    disabled={selected.size === 0 || bulkBusy}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete selected
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

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
                            setEdges((es) => {
                                const others = es.filter((e) => e.reminder_id !== saved.id);
                                const fresh = edgesFromReminder(saved);
                                return [...others, ...fresh];
                            });
                            toast.success('Reminder updated.');
                        } else {
                            setReloadKey((k) => k + 1);
                            toast.success('Reminder created.');
                        }
                    }}
                />
            )}
        </div>
    );
}
