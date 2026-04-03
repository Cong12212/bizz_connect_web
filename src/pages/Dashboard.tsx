// src/pages/Dashboard.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../utils/hooks';
import AppNav from '../components/AppNav';
import { pickApiBaseUrl } from '../lib/config';
import useDebounced from '../hooks/useDebounced';
import { listRecentContacts, type Contact } from '../services/contacts';
import { listTags, type Tag } from '../services/tags';
import { listNotifications, type Notification } from '../services/notifications';
import { listReminders, type Reminder } from '../services/reminders';

// Type cho Recent Activity
type ActivityItem = {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    time: string;
    status: 'pending' | 'completed' | 'overdue';
    type: 'reminder' | 'notification' | 'contact';
};

export default function Dashboard() {
    const navigate = useNavigate();

    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const apiBase = pickApiBaseUrl();
    const hasApi = !!apiBase;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Real data from APIs
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [totalContacts, setTotalContacts] = useState<number>(0);
    const [tags, setTags] = useState<Tag[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // Fetch all dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!hasApi || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Parallel fetch all data
            const [contactsRes, tagsRes, notificationsRes, remindersRes] = await Promise.all([
                listRecentContacts('', token).catch(() => ({ data: [], total: 0 })),
                listTags({}, token).catch(() => ({ data: [], total: 0 })),
                listNotifications('unread', 20, token).catch(() => ({ data: [] })),
                listReminders({ status: 'pending' }, token).catch(() => ({ data: [], total: 0 })),
            ]);

            setContacts(contactsRes.data || []);
            setTotalContacts(Number((contactsRes as any)?.total) || (contactsRes.data?.length ?? 0));
            setTags(tagsRes.data || []);
            setNotifications(notificationsRes.data || []);
            setReminders(remindersRes.data || []);
        } catch (e: any) {
            setError(e?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [token, hasApi]);

    useEffect(() => {
        void fetchDashboardData();
    }, [fetchDashboardData]);

    // Calculate stats from real data
    const stats = useMemo(() => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Count new contacts this week
        const newContactsThisWeek = contacts.filter(c => {
            if (!c.created_at) return false;
            return new Date(c.created_at) >= weekAgo;
        }).length;

        // Count overdue reminders
        const overdueReminders = reminders.filter(r => {
            if (!r.due_at || r.status !== 'pending') return false;
            return new Date(r.due_at) < now;
        }).length;

        // Count new tags this month
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        const newTagsThisMonth = tags.filter(t => {
            // backend does not return created_at for tags yet — treat all as new
            return true;
        }).length;

        return {
            activePartners: totalContacts,
            activePartnersChange: newContactsThisWeek > 0 ? `+${newContactsThisWeek} this week` : 'No new contacts',
            pendingReminders: reminders.length,
            pendingRemindersOverdue: overdueReminders > 0 ? `${overdueReminders} overdue` : 'All on time',
            newNotifications: notifications.length,
            newNotificationsTime: 'un read yet',
            activeTags: tags.length,
            activeTagsNew: newTagsThisMonth > 0 ? `${Math.min(newTagsThisMonth, tags.length)} active` : 'No tags yet'
        };
    }, [contacts, totalContacts, reminders, notifications, tags]);

    // Convert real data to Recent Activity format
    const recentActivity = useMemo((): ActivityItem[] => {
        const activities: ActivityItem[] = [];
        const now = new Date();

        // Add reminders (top priority)
        reminders.slice(0, 3).forEach(r => {
            const isOverdue = r.due_at && new Date(r.due_at) < now && r.status === 'pending';
            const timeAgo = r.due_at ? formatTimeAgo(new Date(r.due_at)) : 'No due date';

            activities.push({
                id: `reminder-${r.id}`,
                icon: '🕐',
                title: isOverdue ? `Overdue: ${r.title}` : r.title,
                subtitle: r.note || 'Reminder scheduled',
                time: timeAgo,
                status: isOverdue ? 'overdue' : r.status === 'done' ? 'completed' : 'pending',
                type: 'reminder'
            });
        });

        // Add recent contacts
        contacts.slice(0, 2).forEach(c => {
            activities.push({
                id: `contact-${c.id}`,
                icon: '👥',
                title: `Contact added: ${c.name}`,
                subtitle: c.company || c.job_title || 'New contact',
                time: c.created_at ? formatTimeAgo(new Date(c.created_at)) : 'Recently',
                status: 'completed',
                type: 'contact'
            });
        });

        // Add notifications
        notifications.slice(0, 2).forEach(n => {
            activities.push({
                id: `notification-${n.id}`,
                icon: '🔔',
                title: n.title,
                subtitle: n.body || 'New notification',
                time: formatTimeAgo(new Date(n.created_at)),
                status: n.status === 'read' ? 'completed' : 'pending',
                type: 'notification'
            });
        });

        // Sort by time (most recent first) and limit to 5
        return activities.slice(0, 5);
    }, [reminders, contacts, notifications]);

    // Calculate upcoming items from real data
    const upcomingItems = useMemo(() => {
        const items = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Reminders due today
        const remindersDueToday = reminders.filter(r => {
            if (!r.due_at || r.status !== 'pending') return false;
            const dueDate = new Date(r.due_at);
            const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
            return dueDateOnly.getTime() === today.getTime();
        }).length;

        if (remindersDueToday > 0) {
            items.push({
                id: 1,
                icon: '🔔',
                iconColor: 'bg-orange-100 text-orange-600',
                title: `${remindersDueToday} reminder${remindersDueToday > 1 ? 's' : ''} due today`,
                subtitle: 'Check your reminders tab'
            });
        }

        // Tags status
        if (tags.length > 0) {
            items.push({
                id: 2,
                icon: '✓',
                iconColor: 'bg-green-100 text-green-600',
                title: `${tags.length} active tags`,
                subtitle: 'All tags up to date'
            });
        }

        // Unread notifications
        if (notifications.length > 0) {
            items.push({
                id: 3,
                icon: '🔔',
                iconColor: 'bg-purple-100 text-purple-600',
                title: `${notifications.length} unread notification${notifications.length > 1 ? 's' : ''}`,
                subtitle: 'Review when you have time'
            });
        }

        // If no items, show placeholder
        if (items.length === 0) {
            items.push({
                id: 0,
                icon: '✨',
                iconColor: 'bg-slate-100 text-slate-600',
                title: 'All caught up!',
                subtitle: 'No upcoming tasks'
            });
        }

        return items;
    }, [reminders, tags, notifications]);

    // Calculate partnership growth from real data
    const partnershipGrowth = useMemo(() => {
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisMonthContacts = contacts.filter(c => {
            if (!c.created_at) return false;
            return new Date(c.created_at) >= thisMonth;
        }).length;

        const lastMonthContacts = contacts.filter(c => {
            if (!c.created_at) return false;
            const createdDate = new Date(c.created_at);
            return createdDate >= lastMonth && createdDate < thisMonth;
        }).length;

        const percentChange = lastMonthContacts > 0
            ? Math.round(((thisMonthContacts - lastMonthContacts) / lastMonthContacts) * 100)
            : 0;

        return {
            count: thisMonthContacts,
            change: percentChange,
            message: thisMonthContacts > 0
                ? `You've added ${thisMonthContacts} new partner${thisMonthContacts > 1 ? 's' : ''} this month${percentChange !== 0 ? `, a ${Math.abs(percentChange)}% ${percentChange > 0 ? 'increase' : 'decrease'} from last month` : ''}. Keep up the great work!`
                : 'No new partners added this month. Start growing your network!'
        };
    }, [contacts]);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full';
            case 'overdue':
                return 'bg-red-100 text-red-700 text-xs px-3 py-1 rounded-full';
            default:
                return 'bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full';
        }
    };

    // Quick actions handlers
    const handleAddPartner = () => navigate('/contacts'); // Will trigger "Add" button
    const handleSetReminder = () => navigate('/reminders'); // Navigate to reminders page
    const handleManageTags = () => navigate('/tags'); // Navigate to tags page
    const handleViewNotifications = () => navigate('/notifications'); // Navigate to notifications page
    const handleViewActivity = () => {
        // TODO: Navigate to activity log when implemented
        console.log('View all activity');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile top bar */}
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>

            {/* Desktop sidebar (fixed) */}
            <AppNav variant="sidebar" />

            {/* MAIN */}
            <main className="px-4 py-6 md:ml-64 md:px-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Partner Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Welcome back! Here&apos;s what&apos;s happening with your partners.
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {/* 4 thẻ thống kê - DATA FROM API */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Active Partners - click để đi tới /contacts */}
                    <button
                        type="button"
                        onClick={() => navigate('/contacts')}
                        className="text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                        title="View all partners"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                    Active Partners
                                    <span className="text-sky-500">👥</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {loading ? '...' : stats.activePartners}
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                    {loading ? 'Loading...' : stats.activePartnersChange}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Pending Reminders - DATA FROM API, click để đi tới /reminders */}
                    <button
                        type="button"
                        onClick={() => navigate('/reminders')}
                        className="text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                        title="View all reminders"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                    Pending Reminders
                                    <span className="text-orange-500">🕐</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {loading ? '...' : stats.pendingReminders}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {loading ? 'Loading...' : stats.pendingRemindersOverdue}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* New Notifications - DATA FROM API, click để đi tới /notifications */}
                    <button
                        type="button"
                        onClick={() => navigate('/notifications')}
                        className="text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                        title="View all notifications"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                    New Notifications
                                    <span className="text-purple-500">🔔</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {loading ? '...' : stats.newNotifications}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {loading ? 'Loading...' : stats.newNotificationsTime}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Active Tags - DATA FROM API, click để đi tới /tags */}
                    <button
                        type="button"
                        onClick={() => navigate('/tags')}
                        className="text-left bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                        title="View all tags"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-slate-500 mb-2 flex items-center gap-2">
                                    Active Tags
                                    <span className="text-emerald-500">🏷️</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">
                                    {loading ? '...' : stats.activeTags}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {loading ? 'Loading...' : stats.activeTagsNew}
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* 2-column grid: left = Recent Activity, right = Quick Actions */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT - Recent Activity - DATA FROM API */}
                    <div className="lg:col-span-7">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-base font-semibold">Recent Activity</h2>

                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm">
                            {loading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
                                    ))}
                                </div>
                            ) : recentActivity.length > 0 ? (
                                <>
                                    {/* Recent Activity List - DATA FROM API */}
                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0"
                                            >
                                                <div className="text-2xl mt-1">{activity.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-slate-900">{activity.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{activity.subtitle}</div>
                                                    <div className="text-xs text-slate-400 mt-1">{activity.time}</div>
                                                </div>
                                                <span className={getStatusBadgeClass(activity.status)}>{activity.status}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Partnership Growth - DATA FROM API */}
                                    <div className="mt-6 pt-6 border-t">
                                        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                                            <span className="text-2xl">📈</span>
                                            <div>
                                                <div className="font-semibold text-sm text-slate-900">Partnership Growth</div>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    {partnershipGrowth.message}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center text-slate-500">
                                    <span className="text-4xl mb-2 block">📊</span>
                                    <p className="text-sm">No recent activity</p>
                                    <p className="text-xs mt-1">Start by adding contacts or setting reminders</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT - Quick Actions & Upcoming */}
                    <div className="lg:col-span-5">
                        {/* Quick Actions */}
                        <div className="mb-6">
                            <h2 className="text-base font-semibold mb-3">Quick Actions</h2>
                            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                                <button
                                    onClick={handleAddPartner}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="text-2xl">👥</span>
                                    <div>
                                        <div className="font-medium text-sm text-slate-900">Add New Partner</div>
                                        <div className="text-xs text-slate-500">Create a new partner profile</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleSetReminder}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <div className="font-medium text-sm text-slate-900">Set Reminder</div>
                                        <div className="text-xs text-slate-500">Schedule a follow-up task</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleManageTags}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="text-2xl">🏷️</span>
                                    <div>
                                        <div className="font-medium text-sm text-slate-900">Manage Tags</div>
                                        <div className="text-xs text-slate-500">Organize partner categories</div>
                                    </div>
                                </button>
                                <button
                                    onClick={handleViewNotifications}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                >
                                    <span className="text-2xl">🔔</span>
                                    <div>
                                        <div className="font-medium text-sm text-slate-900">View Notifications</div>
                                        <div className="text-xs text-slate-500">Check all your notifications</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Upcoming - DATA FROM API */}
                        <div>
                            <h2 className="text-base font-semibold mb-3">Upcoming</h2>
                            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
                                    ))
                                ) : (
                                    upcomingItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${item.iconColor}`}
                                            >
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-900">{item.title}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
}
