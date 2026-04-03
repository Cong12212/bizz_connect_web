// src/lib/api.ts
import { assertApiUrl } from "./config";

/** Fetch JSON/text from the API (prepends API_BASE, injects Bearer token if available) */
export async function apiFetch<T>(
    path: string,
    init?: RequestInit,
    bearer?: string
): Promise<T> {
    const API_BASE = assertApiUrl();
    const token =
        bearer ??
        (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const headers: Record<string, string> = {
        Accept: "application/json",
        ...(init?.headers as any),
    };

    // Skip Content-Type for FormData — browser sets it with the correct boundary
    const isFD = typeof FormData !== "undefined" && init?.body instanceof FormData;
    if (!isFD && init?.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${normalizePath(path)}`, {
        cache: "no-store",
        ...init,
        headers,
    });

    const hasBody = res.status !== 204 && res.status !== 205;
    const ctype = res.headers.get("content-type") || "";
    const isJson = ctype.includes("application/json");

    if (!res.ok) {
        let data: any;
        try {
            data = isJson && hasBody ? await res.json() : await res.text();
        } catch {
            // ignore
        }
        throw new Error(
            `API ${res.status}: ${(data && (data.message || data.error)) || res.statusText}`
        );
    }

    return (hasBody ? (isJson ? await res.json() : await res.text()) : undefined) as T;
}

/** Fetch a file from the API (xlsx/csv/pdf/image...), returns a Blob */
export async function apiFetchBlob(
    path: string,
    init?: RequestInit,
    bearer?: string
): Promise<Blob> {
    const API_BASE = assertApiUrl();
    const token =
        bearer ??
        (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const headers: Record<string, string> = {
        // Broad Accept header to handle excel/csv responses
        Accept:
            "application/octet-stream,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,*/*",
        ...(init?.headers as any),
    };

    const isFD = typeof FormData !== "undefined" && init?.body instanceof FormData;
    if (!isFD && init?.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${normalizePath(path)}`, {
        cache: "no-store",
        method: init?.method || "GET",
        body: init?.body,
        headers,
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${txt || res.statusText}`);
    }
    return res.blob();
}

/* ---------- Helpers ---------- */
function normalizePath(p: string) {
    if (!p) return "/";
    return p.startsWith("/") ? p : `/${p}`;
}
