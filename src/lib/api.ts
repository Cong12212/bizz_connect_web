// src/lib/api.ts
import { assertApiUrl } from './config';

export async function apiFetch<T>(
    path: string,
    init?: RequestInit,
    bearer?: string
): Promise<T> {
    const API_BASE = assertApiUrl();
    const token =
        bearer ??
        (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(init?.headers as any),
    };
    const isFD = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    if (!isFD && init?.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
        cache: 'no-store',
        ...init,
        headers,
    });

    const hasBody = res.status !== 204 && res.status !== 205;
    const isJson = (res.headers.get('content-type') || '').includes('application/json');

    if (!res.ok) {
        let data: any;
        try { data = isJson && hasBody ? await res.json() : await res.text(); } catch { }
        throw new Error(`API ${res.status}: ${(data && (data.message || data.error)) || res.statusText}`);
    }

    return (hasBody ? (isJson ? await res.json() : await res.text()) : undefined) as T;
}
