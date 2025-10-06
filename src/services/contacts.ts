import { apiFetch } from '../lib/api';

export type Contact = {
    id: number;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
    tags?: Tag[];
};

export type Tag = { id: number; name: string };

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export async function listContacts(params: {
    q?: string;
    page?: number;
    per_page?: number;
    sort?: 'name' | '-name' | 'id' | '-id';
    tag_ids?: number[]; // filter by tags
}, token?: string): Promise<Paginated<Contact>> {
    const p = new URLSearchParams();
    if (params.q) p.set('q', params.q);
    if (params.page) p.set('page', String(params.page));
    if (params.per_page) p.set('per_page', String(params.per_page));
    if (params.sort) p.set('sort', params.sort);
    if (params.tag_ids?.length) p.set('tag_ids', params.tag_ids.join(','));
    return apiFetch(`/contacts?${p.toString()}`, undefined, token);
}

export async function listRecentContacts(q: string, token?: string) {
    const p = new URLSearchParams();
    p.set('per_page', '4');
    if (q.trim()) p.set('q', q.trim());
    return apiFetch<Paginated<Contact>>(`/contacts?${p.toString()}`, undefined, token);
}

export async function createContact(payload: Partial<Contact>, token?: string) {
    const res = await apiFetch<{ data: Contact }>(
        `/contacts`,
        { method: 'POST', body: JSON.stringify(payload) },
        token
    );
    return res.data;
}

export async function updateContact(id: number, payload: Partial<Contact>, token?: string) {
    const res = await apiFetch<{ data: Contact }>(
        `/contacts/${id}`,
        { method: 'PUT', body: JSON.stringify(payload) },
        token
    );
    return res.data;
}

export async function deleteContact(id: number, token?: string) {
    await apiFetch<void>(`/contacts/${id}`, { method: 'DELETE' }, token);
}

export async function attachTags(contactId: number, body: { ids?: number[]; names?: string[]; company_id?: number | null }, token?: string) {
    return apiFetch<Contact>(`/contacts/${contactId}/tags`, {
        method: 'POST',
        body: JSON.stringify(body),
    }, token);
}

export async function detachTag(contactId: number, tagId: number, token?: string) {
    return apiFetch<Contact>(`/contacts/${contactId}/tags/${tagId}`, { method: 'DELETE' }, token);
}
