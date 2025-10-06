import { apiFetch } from '../lib/api';

export type Tag = { id: number; name: string; company_id?: number | null };

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export async function listTags(q = '', token?: string) {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    return apiFetch<Paginated<Tag>>(`/tags?${p.toString()}`, undefined, token);
}

export async function createTag(name: string, company_id?: number | null, token?: string) {
    return apiFetch<Tag>(`/tags`, {
        method: 'POST',
        body: JSON.stringify({ name, company_id: company_id ?? null }),
    }, token);
}

export async function renameTag(id: number, name: string, token?: string) {
    return apiFetch<Tag>(`/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
    }, token);
}

export async function deleteTag(id: number, token?: string) {
    await apiFetch<void>(`/tags/${id}`, { method: 'DELETE' }, token);
}
