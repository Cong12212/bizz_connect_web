'use client';

import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import { useNavigate } from 'react-router-dom';

import {
    listNotifications,
    markNotificationRead,
    bulkReadNotifications,
    type Notification,
} from '../services/notifications';

type Scope = 'all' | 'unread' | 'upcoming' | 'past';

const typeEmoji: Record<string, string> = {
    'contact.created': '👤',
    'reminder.created': '⏰',
    'reminder.upcoming': '🔔',
    'reminder.done': '✅',
};

function formatWhen(n: Notification) {
    const iso = n.scheduled_at || n.created_at;
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString();
}

function targetPath(n: Notification): string {
    if (n.reminder_id) return `/reminders?rid=${n.reminder_id}`;
    if (n.contact_id) return `/contacts/${n.contact_id}`;
    if (n.type.startsWith('contact')) return '/contacts';
    if (n.type.startsWith('reminder')) return '/reminders';
    return '/';
}

export default function NotificationsPage() {
    const navigate = useNavigate();

    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const [scope, setScope] = useState<Scope>('all');
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [items, setItems] = useState<Notification[]>([]);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [refreshKey, setRefreshKey] = useState(0);

    // fetch
    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr(null);
        listNotifications(scope, 20, token)
            .then((res) => {
                if (!alive) return;
                setItems(res.data || []);
                setSelected(new Set());
            })
            .catch((e) => setErr(e?.message || 'Failed to load notifications'))
            .finally(() => setLoading(false));
        return () => { alive = false; };
    }, [scope, token, refreshKey]);

    // selection helpers
    const pageIds = useMemo(() => items.map((i) => i.id), [items]);
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

    // actions
    async function doMarkRead(id: number) {
        await markNotificationRead(id, token);
        setItems((arr) =>
            arr.map((n) => (n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)),
        );
    }
    async function doBulkRead() {
        const ids = Array.from(selected);
        if (!ids.length) return;
        await bulkReadNotifications(ids, token);
        setItems((arr) =>
            arr.map((n) => (selected.has(n.id) ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)),
        );
        setSelected(new Set());
    }

    async function openNotification(n: Notification) {
        const href = targetPath(n);
        if (n.status === 'unread') {
            try {
                await markNotificationRead(n.id, token);
                setItems((arr) =>
                    arr.map((x) => (x.id === n.id ? { ...x, status: 'read', read_at: new Date().toISOString() } : x)),
                );
            } catch {
                /* ignore read error; still navigate */
            }
        }
        navigate(href);
    }

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="md:ml-64 h-screen overflow-hidden p-4">
                <div className="mx-auto max-w-5xl h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-semibold">Notifications</h1>

                        <div className="ml-2 flex items-center gap-2 rounded-xl border bg-white p-1 text-sm">
                            {(['all', 'unread', 'upcoming', 'past'] as Scope[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setScope(s)}
                                    className={`rounded-lg px-3 py-1.5 ${scope === s ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setRefreshKey((k) => k + 1)}
                            className="ml-auto rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {err && <div className="mb-2 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>}

                    {/* Card: list area scrollable */}
                    <div className="overflow-hidden rounded-xl border bg-white flex min-h-0 flex-col">
                        {/* Sticky header */}
                        <div className="grid grid-cols-[40px_1.4fr_1fr_120px_140px] items-center gap-2 border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sticky top-0 z-10">
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
                            <div>Title & Body</div>
                            <div>Type</div>
                            <div>When</div>
                            <div>Actions</div>
                        </div>

                        {/* Scroll area */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-3">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                                    ))}
                                </div>
                            ) : items.length ? (
                                <ul>
                                    {items.map((n) => {
                                        const checked = selected.has(n.id);
                                        const emoji = typeEmoji[n.type] ?? '🔷';
                                        const unread = n.status === 'unread';

                                        return (
                                            <li
                                                key={n.id}
                                                className={`grid grid-cols-[40px_1.4fr_1fr_120px_140px] items-center gap-2 px-3 py-2 transition-colors ${unread
                                                    ? 'bg-slate-100 hover:bg-slate-200'
                                                    : 'bg-white hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div>
                                                    <input
                                                        type="checkbox"
                                                        disabled={loading}
                                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                                        checked={checked}
                                                        onChange={(e) => toggleOne(n.id, e.target.checked)}
                                                    />
                                                </div>

                                                {/* Clickable → open; unread có chấm xanh + title đậm hơn nhẹ */}
                                                <button
                                                    className="min-w-0 text-left"
                                                    onClick={() => openNotification(n)}
                                                    title="Open details"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg leading-none">{emoji}</span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className={`truncate text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>
                                                                {n.title}{' '}
                                                                {unread && (
                                                                    <span className="ml-1 inline-block h-2 w-2 rounded-full bg-sky-500 align-middle" />
                                                                )}
                                                            </div>
                                                            <div className="truncate text-xs text-slate-500">
                                                                {n.body || '—'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                <div className="truncate text-xs text-slate-600">{n.type}</div>
                                                <div className="truncate text-xs">{formatWhen(n)}</div>

                                                <div className="flex flex-wrap gap-2">
                                                    {unread && (
                                                        <button
                                                            className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                doMarkRead(n.id);
                                                            }}
                                                        >
                                                            Mark read
                                                        </button>
                                                    )}
                                                    <button
                                                        className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openNotification(n);
                                                        }}
                                                    >
                                                        Open
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="p-6 text-center text-sm text-slate-500">No notifications</div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="flex flex-col gap-2 border-t p-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="order-2 flex items-center gap-2 sm:order-1">
                                <span>
                                    Selected: <b>{selected.size}</b> / {items.length}
                                </span>
                                <button
                                    onClick={() => toggleAllCurrentPage(true)}
                                    disabled={!pageIds.length}
                                    className="rounded-md border px-2 py-1 disabled:opacity-50"
                                    title="Select all"
                                >
                                    Select all
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
                                    onClick={doBulkRead}
                                    disabled={selected.size === 0}
                                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Mark read (bulk)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                        Read-only: you can mark as read and open details. Backend shows up to 20 latest; DB retains 50 per user.
                    </div>
                </div>
            </main>
        </div>
    );
}
