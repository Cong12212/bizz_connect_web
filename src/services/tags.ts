import { apiFetch } from "../lib/api";

export type Tag = {
    id: number;
    name: string;
    contacts_count?: number;
};

export type Paginated<T> = {
    data: T[];
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

export async function listTags(params: { q?: string; page?: number }, token?: string) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.page) p.set("page", String(params.page));
    return apiFetch<Paginated<Tag>>(`/tags?${p.toString()}`, undefined, token);
}

export async function createTag(name: string, token?: string) {
    return apiFetch<Tag>(`/tags`, {
        method: "POST",
        body: JSON.stringify({ name }),
    }, token);
}

export async function renameTag(id: number, name: string, token?: string) {
    return apiFetch<Tag>(`/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
    }, token);
}

export async function deleteTagApi(id: number, token?: string) {
    await apiFetch<void>(`/tags/${id}`, { method: "DELETE" }, token);
}
