import { apiFetch } from "../lib/api";

export type ReminderStatus = "pending" | "done" | "skipped" | "cancelled";
export type ReminderChannel = "app" | "email" | "calendar";

export type Reminder = {
    id: number;
    contact_id: number | null;     // primary contact
    owner_user_id: number;
    title: string;
    note?: string | null;
    due_at: string | null;         // ISO
    status: ReminderStatus;
    channel?: ReminderChannel;
    external_event_id?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
};

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export type ReminderCreateInput = {
    // NEW: nhiều contact
    contact_ids?: number[];
    contact_id?: number;                 // primary (phần tử đầu của contact_ids)
    title: string;
    note?: string | null;
    due_at: string | Date | null;
    status?: ReminderStatus;
    channel?: ReminderChannel;
    external_event_id?: string | null;
};

export type ReminderUpdateInput = {
    // NEW: thay toàn bộ ds contact / đổi primary
    contact_ids?: number[];
    contact_id?: number;
    title?: string;
    note?: string | null;
    due_at?: string | Date | null;
    status?: ReminderStatus;
    channel?: ReminderChannel;
    external_event_id?: string | null;
};

export type ReminderEdge = {
    edge_key: string;           // "reminderId:contactId"
    reminder_id: number;
    contact_id: number;
    title: string;
    note?: string | null;
    due_at: string | null;
    status: ReminderStatus;
    channel?: ReminderChannel;
    is_primary: 0 | 1;
    contact_name: string;
    contact_company?: string | null;
};

type BulkStatusResp = { updated: number };
type BulkDeleteResp = { deleted: number };

const toStrDate = (v: string | Date | null | undefined) =>
    v instanceof Date ? v.toISOString() : (v ?? null);

/** ================= List / CRUD ================= */

export async function listReminders(
    params: {
        status?: ReminderStatus;
        before?: string | Date;
        after?: string | Date;
        overdue?: boolean;
        contact_id?: number;
        page?: number;
        per_page?: number;
    } = {},
    token?: string
) {
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.before) p.set("before", toStrDate(params.before)!);
    if (params.after) p.set("after", toStrDate(params.after)!);
    if (params.overdue) p.set("overdue", "1");
    if (params.contact_id) p.set("contact_id", String(params.contact_id));
    if (params.page) p.set("page", String(params.page));
    if (params.per_page) p.set("per_page", String(params.per_page));
    return apiFetch<Paginated<Reminder>>(`/reminders?${p.toString()}`, undefined, token);
}

export async function getReminder(id: number, token?: string) {
    // Backend trả reminder + (optional) contacts[]
    return apiFetch<any>(`/reminders/${id}`, undefined, token);
}

export async function createReminder(input: ReminderCreateInput, token?: string) {
    const body = JSON.stringify({ ...input, due_at: toStrDate(input.due_at) });
    return apiFetch<Reminder>(`/reminders`, { method: "POST", body }, token);
}

export async function updateReminder(id: number, input: ReminderUpdateInput, token?: string) {
    const body = JSON.stringify({
        ...input,
        ...(input.due_at !== undefined ? { due_at: toStrDate(input.due_at) } : {}),
    });
    return apiFetch<Reminder>(`/reminders/${id}`, { method: "PATCH", body }, token);
}

export async function deleteReminderApi(id: number, token?: string) {
    await apiFetch<void>(`/reminders/${id}`, { method: "DELETE" }, token);
}

export async function markReminderDone(id: number, token?: string) {
    return apiFetch<Reminder>(`/reminders/${id}/done`, { method: "POST" }, token);
}

/** ================= Bulk ================= */

export async function bulkUpdateReminderStatus(ids: number[], status: ReminderStatus, token?: string) {
    const body = JSON.stringify({ ids, status });
    return apiFetch<BulkStatusResp>(`/reminders/bulk-status`, { method: "POST", body }, token);
}

export async function bulkDeleteReminders(ids: number[], token?: string) {
    const body = JSON.stringify({ ids });
    return apiFetch<BulkDeleteResp>(`/reminders/bulk-delete`, { method: "POST", body }, token);
}

export async function listReminderEdges(
    params: {
        status?: ReminderStatus;
        before?: string | Date;
        after?: string | Date;
        overdue?: boolean;
        contact_id?: number;
        page?: number;
        per_page?: number;
    } = {},
    token?: string
) {
    const toStr = (v: any) => (v instanceof Date ? v.toISOString() : v);
    const p = new URLSearchParams();
    if (params.status) p.set("status", params.status);
    if (params.before) p.set("before", toStr(params.before));
    if (params.after) p.set("after", toStr(params.after));
    if (params.overdue) p.set("overdue", "1");
    if (params.contact_id) p.set("contact_id", String(params.contact_id));
    if (params.page) p.set("page", String(params.page));
    if (params.per_page) p.set("per_page", String(params.per_page));
    return apiFetch<Paginated<ReminderEdge>>(`/reminders/pivot?${p.toString()}`, undefined, token);
}

// detach 1 edge (xoá quan hệ contact↔reminder, KHÔNG xoá reminder)
export async function detachReminderContact(reminderId: number, contactId: number, token?: string) {
    return apiFetch<void>(`/reminders/${reminderId}/contacts/${contactId}`, { method: "DELETE" }, token);
}
