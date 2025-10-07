import { apiFetch } from "../lib/api";

export type Tag = { id: number; name: string };

export type Contact = {
    id: number;
    name: string;
    job_title?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    linkedin_url?: string | null;
    website_url?: string | null;
    source?: string | null;
    tags?: Tag[];
    created_at?: string;
    updated_at?: string;
};

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

// Convert "" -> null (thân thiện với Laravel), giữ undefined nguyên vẹn
function toNulls<T extends object>(obj: T): T {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
    return out as T;
}

export async function listContacts(
    params: {
        q?: string;
        page?: number;
        per_page?: number;
        sort?: "name" | "-name" | "id" | "-id";
        tag_ids?: number[];
        tags?: string[];
        tag_mode?: 'any' | 'all';
    },
    token?: string
): Promise<Paginated<Contact>> {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.page) p.set("page", String(params.page));
    if (params.per_page) p.set("per_page", String(params.per_page));
    if (params.sort) p.set("sort", params.sort);
    if (params.tag_ids?.length) p.set("tag_ids", params.tag_ids.join(","));
    if (params.tags?.length) p.set('tags', params.tags.join(','));   // <-- mới
    if (params.tag_mode) p.set('tag_mode', params.tag_mode);
    return apiFetch(`/contacts?${p.toString()}`, undefined, token);
}

export async function listRecentContacts(q: string, token?: string) {
    const p = new URLSearchParams();
    p.set("per_page", "4");
    if (q.trim()) p.set("q", q.trim());
    return apiFetch<Paginated<Contact>>(`/contacts?${p.toString()}`, undefined, token);
}

export async function getContact(id: number, token?: string): Promise<Contact> {
    const res = await apiFetch<{ data: Contact } | Contact>(`/contacts/${id}`, undefined, token);
    return (res as any).data ?? (res as Contact);
}

export async function createContact(payload: Partial<Contact>, token?: string) {
    const res = await apiFetch<{ data: Contact }>(
        `/contacts`,
        { method: "POST", body: JSON.stringify(toNulls(payload)) },
        token
    );
    return res.data;
}

export async function updateContact(id: number, payload: Partial<Contact>, token?: string) {
    const res = await apiFetch<{ data: Contact }>(
        `/contacts/${id}`,
        { method: "PUT", body: JSON.stringify(toNulls(payload)) },
        token
    );
    return res.data;
}

export async function deleteContact(id: number, token?: string) {
    await apiFetch<void>(`/contacts/${id}`, { method: "DELETE" }, token);
}

export async function attachTags(
    contactId: number,
    body: { ids?: number[]; names?: string[]; company_id?: number | null },
    token?: string
) {
    return apiFetch<Contact>(
        `/contacts/${contactId}/tags`,
        { method: "POST", body: JSON.stringify(body) },
        token
    );
}

export async function detachTag(contactId: number, tagId: number, token?: string) {
    return apiFetch<Contact>(`/contacts/${contactId}/tags/${tagId}`, { method: "DELETE" }, token);
}
