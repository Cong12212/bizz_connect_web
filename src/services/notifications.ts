import { apiFetch } from "../lib/api";

export type Notification = {
    id: number;
    owner_user_id: number;
    type: string;
    title: string;
    body?: string | null;
    data?: any;
    contact_id?: number | null;
    reminder_id?: number | null;
    status: 'unread' | 'read' | 'done' | 'archived';
    scheduled_at?: string | null;
    read_at?: string | null;
    created_at: string;
    updated_at: string;
};

export async function listNotifications(scope: 'all' | 'unread' | 'upcoming' | 'past' = 'all', perPage = 20, token?: string) {
    const p = new URLSearchParams({ scope, per_page: String(perPage) });
    return apiFetch<{ data: Notification[] }>(`/notifications?${p.toString()}`, undefined, token);
}

export async function markNotificationRead(id: number, token?: string) {
    return apiFetch<Notification>(`/notifications/${id}/read`, { method: 'POST' }, token);
}

export async function markNotificationDone(id: number, token?: string) {
    return apiFetch<Notification>(`/notifications/${id}/done`, { method: 'POST' }, token);
}

export async function bulkReadNotifications(ids: number[], token?: string) {
    return apiFetch<{ updated: number }>(`/notifications/bulk-read`, {
        method: 'POST',
        body: JSON.stringify({ ids }),
    }, token);
}

export async function deleteNotification(id: number, token?: string) {
    await apiFetch<void>(`/notifications/${id}`, { method: 'DELETE' }, token);
}
