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
    UserMinus,
    Calendar,
    Users,
    Filter,
    Plus
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

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

function StatusBadge({ status }: { status: ReminderStatus }) {
    const config = {
        pending: {
            icon: Clock,
            bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
            text: 'text-amber-700',
            ring: 'ring-amber-200',
            label: 'Pending',
            dot: 'bg-amber-500'
        },
        done: {
            icon: CheckCircle2,
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
            text: 'text-emerald-700',
            ring: 'ring-emerald-200',
            label: 'Done',
            dot: 'bg-emerald-500'
        },
        skipped: {
            icon: MinusCircle,
            bg: 'bg-gradient-to-r from-slate-50 to-gray-50',
            text: 'text-slate-700',
            ring: 'ring-slate-200',
            label: 'Skipped',
            dot: 'bg-slate-500'
        },
        cancelled: {
            icon: XCircle,
            bg: 'bg-gradient-to-r from-rose-50 to-red-50',
            text: 'text-rose-700',
            ring: 'ring-rose-200',
            label: 'Cancelled',
            dot: 'bg-rose-500'
        },
    }[status] || {
        icon: Clock,
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        ring: 'ring-slate-200',
        label: status,
        dot: 'bg-slate-500'
    };

    const Icon = config.icon;

    return (
        <span className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1',
            config.bg,
            config.text,
            config.ring
        )}>
            <span className={cn('h-2 w-2 rounded-full', config.dot)} />
            {config.label}
        </span>
    );
}

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
                    className="absolute z-40 mt-2 w-[380px] rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    onMouseLeave={onClose}
                >
                    <div className="max-h-[320px] overflow-y-auto p-3">{children}</div>
                </div>
            )}
        </div>
    );
}

// Helper: get initials for avatar
function initials(name?: string): string {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

export default function RemindersPage() {
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const toast = useToast();

    const [status, setStatus] = useState<'' | ReminderStatus>('');
    const [overdue] = useState(false);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [contactId, setContactId] = useState<number | undefined>(undefined);

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [reloadKey, setReloadKey] = useState(0);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [edges, setEdges] = useState<ReminderEdge[]>([]);
    const [lastPage, setLastPage] = useState(1);

    const [selected, setSelected] = useState<Set<number>>(new Set());

    const [pickContactOpen, setPickContactOpen] = useState(false);
    const [openMoreOf, setOpenMoreOf] = useState<number | null>(null);
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
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setErr(e?.message || 'Failed to load reminders');
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, [debKey, token, reloadKey]);

    // Group by reminder
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

    const pageIds = groups.map((g) => g.id);
    const allPageChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

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

    // Actions
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="px-4 py-6 md:ml-64 md:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="h-7 w-7 text-blue-600" />
                            Reminders
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Manage your reminders and follow-ups
                        </p>
                    </div>

                    {/* Filters Bar */}
                    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Filters:</span>
                            </div>

                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value as any);
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">All status</option>
                                <option value="pending">🟡 Pending</option>
                                <option value="done">✅ Done</option>
                                <option value="skipped">⏭️ Skipped</option>
                                <option value="cancelled">❌ Cancelled</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">From:</span>
                                <input
                                    type="datetime-local"
                                    value={from}
                                    onChange={(e) => {
                                        setFrom(e.target.value);
                                        setPage(1);
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">To:</span>
                                <input
                                    type="datetime-local"
                                    value={to}
                                    onChange={(e) => {
                                        setTo(e.target.value);
                                        setPage(1);
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {contactId && (
                                <button
                                    onClick={() => setContactId(undefined)}
                                    className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                >
                                    Clear contact filter
                                </button>
                            )}

                            <div className="ml-auto">
                                <button
                                    onClick={() => setFormOpen({ mode: 'create' })}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Reminder
                                </button>
                            </div>
                        </div>
                    </div>

                    {err && (
                        <div className="mb-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 text-sm text-red-700">
                            <div className="flex items-center gap-2">
                                <XCircle className="h-5 w-5" />
                                <span className="font-medium">{err}</span>
                            </div>
                        </div>
                    )}

                    {/* Bulk Actions Bar */}
                    {selected.size > 0 && (
                        <div className="mb-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900">
                                        {selected.size} reminder{selected.size > 1 ? 's' : ''} selected
                                    </span>
                                    <button
                                        onClick={() => setSelected(new Set())}
                                        className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-white/50"
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => doBulkStatus('done')}
                                        disabled={bulkBusy}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Mark Done
                                    </button>
                                    <button
                                        onClick={() => doBulkStatus('pending')}
                                        disabled={bulkBusy}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Clock className="h-4 w-4" />
                                        Set Pending
                                    </button>
                                    <button
                                        onClick={doBulkDelete}
                                        disabled={bulkBusy}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reminders Cards */}
                    {loading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />
                            ))}
                        </div>
                    ) : groups.length > 0 ? (
                        <div className="space-y-4">
                            {groups.map((g) => {
                                const checked = selected.has(g.id);
                                const maxInline = 2;
                                const shown = g.contacts.slice(0, maxInline);
                                const hiddenCount = Math.max(0, g.contacts.length - shown.length);

                                return (
                                    <div
                                        key={g.id}
                                        className={cn(
                                            'rounded-2xl bg-white border-2 shadow-sm hover:shadow-md transition-all',
                                            checked ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
                                        )}
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        disabled={loading}
                                                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                        checked={checked}
                                                        onChange={(e) => toggleGroup(g.id, e.target.checked)}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Title & Status */}
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                                                                {g.title}
                                                            </h3>
                                                            {g.note && (
                                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                                    {g.note}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <StatusBadge status={g.status} />
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-600">
                                                        <Calendar className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium">Due:</span>
                                                        <span>{formatUTCAsIs(g.due_at)}</span>
                                                    </div>

                                                    {/* Contacts */}
                                                    <div className="mb-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Users className="h-4 w-4 text-slate-400" />
                                                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                                Contacts ({g.contacts.length})
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {shown.map((c) => (
                                                                <div
                                                                    key={c.id}
                                                                    className={cn(
                                                                        'inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-all',
                                                                        c.is_primary
                                                                            ? 'border-blue-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm'
                                                                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                                                                        c.is_primary ? 'bg-white/20' : 'bg-slate-100'
                                                                    )}>
                                                                        {initials(c.name)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="truncate font-semibold">
                                                                            {c.name}
                                                                        </div>
                                                                        {c.company && (
                                                                            <div className={cn(
                                                                                'truncate text-xs',
                                                                                c.is_primary ? 'text-white/80' : 'text-slate-500'
                                                                            )}>
                                                                                {c.company}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <button
                                                                        className={cn(
                                                                            'rounded-md p-1 transition-colors',
                                                                            c.is_primary
                                                                                ? 'hover:bg-white/20'
                                                                                : 'text-rose-600 hover:bg-rose-50'
                                                                        )}
                                                                        title="Remove contact"
                                                                        onClick={() => detachOne(g.id, c.id)}
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {hiddenCount > 0 && (
                                                                <>
                                                                    <button
                                                                        className="inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                                                        onClick={() => setOpenMoreOf((cur) => (cur === g.id ? null : g.id))}
                                                                    >
                                                                        <Users className="h-4 w-4" />
                                                                        +{hiddenCount} more
                                                                    </button>

                                                                    <MorePopover
                                                                        open={openMoreOf === g.id}
                                                                        onClose={() => setOpenMoreOf(null)}
                                                                    >
                                                                        <div className="space-y-2">
                                                                            {g.contacts.map((c) => (
                                                                                <div
                                                                                    key={c.id}
                                                                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-white transition-colors"
                                                                                >
                                                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-sm font-bold text-white">
                                                                                        {initials(c.name)}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <div className="font-semibold text-sm text-slate-900 truncate">
                                                                                            {c.name}
                                                                                        </div>
                                                                                        {c.company && (
                                                                                            <div className="text-xs text-slate-500 truncate">
                                                                                                {c.company}
                                                                                            </div>
                                                                                        )}
                                                                                        {c.is_primary && (
                                                                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 mt-1">
                                                                                                PRIMARY
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <button
                                                                                        className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                                                                                        onClick={() => detachOne(g.id, c.id)}
                                                                                        title="Remove"
                                                                                    >
                                                                                        <UserMinus className="h-4 w-4" />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </MorePopover>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                                            onClick={() => openEdit(g)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                            Edit
                                                        </button>

                                                        {g.status !== 'done' && (
                                                            <button
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                                                                onClick={() => markDoneOne(g.id)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Mark Done
                                                            </button>
                                                        )}

                                                        <button
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                                                            onClick={async () => {
                                                                if (!confirm('Delete this reminder?')) return;
                                                                try {
                                                                    await bulkDeleteReminders([g.id], token);
                                                                    setEdges((es) => es.filter((e) => e.reminder_id !== g.id));
                                                                    toast.success('Reminder deleted.');
                                                                } catch (e: any) {
                                                                    toast.error(e?.message || 'Failed');
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
                            <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No reminders found</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Create your first reminder to get started
                            </p>
                            <button
                                onClick={() => setFormOpen({ mode: 'create' })}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
                            >
                                <Plus className="h-4 w-4" />
                                New Reminder
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && groups.length > 0 && (
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 text-sm font-semibold text-slate-900">
                                    Page {page} of {Math.max(1, lastPage)}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(lastPage || 1, p + 1))}
                                    disabled={page >= lastPage}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>

                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(parseInt(e.target.value, 10));
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {[10, 20, 50, 100].map((n) => (
                                    <option key={n} value={n}>
                                        {n} per page
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={() => toggleAllCurrentPage(true)}
                                disabled={!pageIds.length || allPageChecked}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Select all on page
                            </button>
                        </div>
                    )}
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
