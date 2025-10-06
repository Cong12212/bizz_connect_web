import { apiFetch } from '../lib/api';

export type Reminder = {
    id: number;
    contact_id: number;
    title: string;
    note?: string | null;
    due_at: string;          // ISO
    status: 'pending' | 'done' | 'skipped' | 'cancelled';
};

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export async function listReminders(params: { status?: string; before?: string; after?: string }, token?: string) {
    const p = new URLSearchParams();
    if (params.status) p.set('status', params.status);
    if (params.before) p.set('before', params.before);
    if (params.after) p.set('after', params.after);
    return apiFetch<Paginated<Reminder>>(`/reminders?${p.toString()}`, undefined, token);
}

export async function createReminder(body: { contact_id: number; title: string; note?: string | null; due_at: string }, token?: string) {
    return apiFetch<Reminder>(`/reminders`, { method: 'POST', body: JSON.stringify(body) }, token);
}

export async function updateReminder(id: number, body: Partial<Reminder>, token?: string) {
    return apiFetch<Reminder>(`/reminders/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);
}

export async function deleteReminder(id: number, token?: string) {
    await apiFetch<void>(`/reminders/${id}`, { method: 'DELETE' }, token);
}

export async function markReminderDone(id: number, token?: string) {
    return apiFetch<Reminder>(`/reminders/${id}/done`, { method: 'POST' }, token);
}
