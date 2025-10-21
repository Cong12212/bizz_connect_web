'use client';

import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import {
    Bell,
    BellDot,
    Calendar,
    ClockArrowUp,
    CheckCircle2,
    User,
    Clock,
    RefreshCw,
    ExternalLink,
    Eye,
} from 'lucide-react';

import {
    listNotifications,
    markNotificationRead,
    bulkReadNotifications,
    type Notification,
} from '../services/notifications';

type Scope = 'all' | 'unread' | 'upcoming' | 'past';

function getTypeIcon(type: string) {
    if (type.includes('contact')) return User;
    if (type.includes('reminder.done')) return CheckCircle2;
    if (type.includes('reminder.upcoming')) return BellDot;
    if (type.includes('reminder')) return Clock;
    return Bell;
}

function formatWhen(n: Notification) {
    const iso = n.scheduled_at || n.created_at;
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
    const toast = useToast();

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
            .catch((e) => {
                if (!alive) return;
                setErr(e?.message || 'Failed to load notifications');
                toast.error(e?.message || 'Failed to load notifications');
            })
            .finally(() => {
                if (alive) setLoading(false);
            });
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
        try {
            await markNotificationRead(id, token);
            setItems((arr) =>
                arr.map((n) => (n.id === id ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)),
            );
            toast.success('Marked as read');
        } catch (e: any) {
            toast.error(e?.message || 'Failed to mark as read');
        }
    }

    async function doBulkRead() {
        const ids = Array.from(selected);
        if (!ids.length) return;
        try {
            await bulkReadNotifications(ids, token);
            setItems((arr) =>
                arr.map((n) => (selected.has(n.id) ? { ...n, status: 'read', read_at: new Date().toISOString() } : n)),
            );
            setSelected(new Set());
            toast.success(`Marked ${ids.length} notification(s) as read`);
        } catch (e: any) {
            toast.error(e?.message || 'Failed to mark as read');
        }
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

    const unreadCount = items.filter(n => n.status === 'unread').length;

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="md:ml-64 h-screen overflow-hidden p-4">
                <div className="mx-auto max-w-6xl h-full flex flex-col">
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Notifications</h1>
                            <p className="text-sm text-slate-600">
                                {items.length} total · {unreadCount} unread
                            </p>
                        </div>

                        <button
                            onClick={() => setRefreshKey((k) => k + 1)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {/* Scope filters */}
                    <div className="mb-3 flex items-center gap-2">
                        {([
                            { key: 'all', label: 'All', icon: Bell },
                            { key: 'unread', label: 'Unread', icon: BellDot },
                            { key: 'upcoming', label: 'Upcoming', icon: ClockArrowUp },
                            { key: 'past', label: 'Past', icon: Calendar },
                        ] as Array<{ key: Scope; label: string; icon: any }>).map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setScope(key)}
                                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${scope === key
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Card: list area scrollable */}
                    <div className="overflow-hidden rounded-xl border bg-white flex min-h-0 flex-col shadow-sm">
                        {/* Sticky header */}
                        <div className="grid grid-cols-[40px_1.5fr_140px_180px] items-center gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600 sticky top-0 z-10">
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
                            <div>Notification</div>
                            <div>When</div>
                            <div>Actions</div>
                        </div>

                        {/* Scroll area */}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="p-3">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <div key={i} className="mb-2 h-16 animate-pulse rounded-lg bg-slate-200" />
                                    ))}
                                </div>
                            ) : items.length ? (
                                <ul>
                                    {items.map((n) => {
                                        const checked = selected.has(n.id);
                                        const Icon = getTypeIcon(n.type);
                                        const unread = n.status === 'unread';

                                        return (
                                            <li
                                                key={n.id}
                                                className={`grid grid-cols-[40px_1.5fr_140px_180px] items-center gap-3 px-4 py-3 transition-colors border-b border-slate-100 last:border-0 ${unread
                                                    ? 'bg-blue-50/50 hover:bg-blue-50'
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

                                                {/* Clickable notification content */}
                                                <button
                                                    className="min-w-0 text-left"
                                                    onClick={() => openNotification(n)}
                                                    title="Open details"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${unread ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            <Icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`truncate text-sm ${unread ? 'font-semibold' : 'font-medium'}`}>
                                                                    {n.title}
                                                                </div>
                                                                {unread && (
                                                                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                                                )}
                                                            </div>
                                                            <div className="truncate text-xs text-slate-500 mt-0.5">
                                                                {n.body || '—'}
                                                            </div>
                                                            <div className="mt-1">
                                                                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                                    {n.type}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>

                                                <div className="text-xs text-slate-600">{formatWhen(n)}</div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {unread && (
                                                        <button
                                                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                doMarkRead(n.id);
                                                            }}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            Mark read
                                                        </button>
                                                    )}
                                                    <button
                                                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openNotification(n);
                                                        }}
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                        Open
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : (
                                <div className="p-12 text-center">
                                    <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                    <div className="text-sm font-medium text-slate-900">No notifications</div>
                                    <div className="text-xs text-slate-500 mt-1">You're all caught up!</div>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="flex flex-col gap-2 border-t bg-slate-50 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                            <div className="order-2 flex flex-wrap items-center gap-2 sm:order-1">
                                <span className="text-sm text-slate-600">
                                    Selected: <b>{selected.size}</b>
                                </span>
                                <button
                                    onClick={() => toggleAllCurrentPage(true)}
                                    disabled={!pageIds.length}
                                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Select all"
                                >
                                    Select all
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
                                    onClick={doBulkRead}
                                    disabled={selected.size === 0}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Mark read
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
