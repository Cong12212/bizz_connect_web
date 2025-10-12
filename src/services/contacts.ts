// src/services/contacts.ts
import { apiFetch, apiFetchBlob } from "../lib/api";

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

// Convert "" -> null (thân thiện Laravel), giữ undefined nguyên
function toNulls<T extends object>(obj: T): T {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
    return out as T;
}

/* ---------- CRUD ---------- */

export async function listContacts(
    params: {
        q?: string;
        page?: number;
        per_page?: number;
        sort?: "name" | "-name" | "id" | "-id";
        tag_ids?: number[];
        tags?: string[];
        tag_mode?: "any" | "all";
        /** NEW (optional): lấy danh sách KHÔNG có tag này */
        without_tag?: number | string;
    },
    token?: string
): Promise<Paginated<Contact>> {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (typeof params.page === "number") p.set("page", String(params.page));
    if (typeof params.per_page === "number") p.set("per_page", String(params.per_page));
    if (params.sort) p.set("sort", params.sort);
    if (params.tag_ids?.length) p.set("tag_ids", params.tag_ids.join(","));
    if (params.tags?.length) p.set("tags", params.tags.join(","));
    if (params.tag_mode) p.set("tag_mode", params.tag_mode);
    // 👇 thêm dòng này
    if (params.without_tag !== undefined && params.without_tag !== null) {
        p.set("without_tag", String(params.without_tag));
    }
    return apiFetch(`/contacts?${p.toString()}`, undefined, token);
}


export async function listRecentContacts(q: string, token?: string) {
    const p = new URLSearchParams();
    p.set("per_page", "4");
    if (q.trim()) p.set("q", q.trim());
    return apiFetch<Paginated<Contact>>(`/contacts?${p.toString()}`, undefined, token);
}

export async function getContact(id: number, token?: string) {
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
    body: { ids?: number[]; names?: string[] },
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

/* ---------- Export / Import ---------- */

/** URL tương đối (nếu cần hiển thị link ở UI) */
export function exportContactsUrl(params: {
    q?: string;
    sort?: "name" | "-name" | "id" | "-id";
    tag_ids?: number[];
    tags?: string[];
    tag_mode?: "any" | "all";
    format?: "xlsx" | "csv";
    ids?: number[]; // optional
}) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.sort) p.set("sort", params.sort);
    if (params.tag_ids?.length) p.set("tag_ids", params.tag_ids.join(","));
    if (params.tags?.length) p.set("tags", params.tags.join(","));
    if (params.tag_mode) p.set("tag_mode", params.tag_mode);
    if (params.ids?.length) p.set("ids", params.ids.join(","));
    p.set("format", params.format || "xlsx");
    return `/contacts/export?${p.toString()}`;
}

/** Tải export (xlsx/csv). Hỗ trợ truyền ids để export các item đã chọn */
export async function downloadContactsExport(
    params: {
        q?: string;
        sort?: "name" | "-name" | "id" | "-id";
        tag_ids?: number[];
        tags?: string[];
        tag_mode?: "any" | "all";
        format?: "xlsx" | "csv";
        ids?: number[];
    },
    token?: string
) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.sort) p.set("sort", params.sort);
    if (params.tag_ids?.length) p.set("tag_ids", params.tag_ids.join(","));
    if (params.tags?.length) p.set("tags", params.tags.join(","));
    if (params.tag_mode) p.set("tag_mode", params.tag_mode);
    if (params.ids?.length) p.set("ids", params.ids.join(","));
    p.set("format", params.format || "xlsx");

    const blob = await apiFetchBlob(`/contacts/export?${p.toString()}`, undefined, token);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contacts_${new Date()
        .toISOString()
        .replace(/[:T\-\.Z]/g, "")
        .slice(0, 14)}.${params.format || "xlsx"}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
}

/** Tải file mẫu (chỉ header) */
export async function downloadContactsTemplate(format: "xlsx" | "csv" = "xlsx", token?: string) {
    const blob = await apiFetchBlob(`/contacts/export-template?format=${format}`, undefined, token);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contacts_template.${format}`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
}

/** Import danh bạ từ Excel/CSV */
export async function importContacts(
    file: File,
    match_by: "id" | "email" | "phone" = "id",
    token?: string
) {
    const form = new FormData();
    form.append("file", file);
    form.append("match_by", match_by);
    return apiFetch(`/contacts/import`, { method: "POST", body: form }, token);
}

type ListBase = Parameters<typeof listContacts>[0];

function buildQS(base: ListBase) {
    const p = new URLSearchParams();
    if (base.q) p.set("q", base.q);
    if (typeof base.page === "number") p.set("page", String(base.page));
    if (typeof base.per_page === "number") p.set("per_page", String(base.per_page));
    if (base.sort) p.set("sort", base.sort);
    // KHÔNG chèn tag filters ở đây, để helper tự xử lý tuỳ trường hợp
    return p;
}

/** Lấy contact KHÔNG có tag (id hoặc name) — không phá signature cũ */
export async function listContactsWithoutTag(
    base: ListBase,
    tag: { id?: number; name?: string },
    token?: string
): Promise<Paginated<Contact>> {
    const p = buildQS(base);
    if (tag.id) p.set("without_tag", String(tag.id));
    else if (tag.name) p.set("without_tag_name", tag.name);
    return apiFetch(`/contacts?${p.toString()}`, undefined, token);
}

/** (tuỳ chọn) ép chắc chắn contact CÓ tag này */
export async function listContactsWithTag(
    base: ListBase,
    tag: { id?: number; name?: string },
    token?: string
): Promise<Paginated<Contact>> {
    // dùng name cho đơn giản; cần id thì set tag_ids
    const params: ListBase = {
        ...base,
        tags: [tag.name!].filter(Boolean),
        tag_mode: "all",
    };
    return listContacts(params, token);
}
