// src/services/auth.ts
import api from "./api";

/** ====== Types ====== */
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };

export type Me = {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    avatar_url?: string | null;
    locale?: string | null;
    timezone?: string | null;
    company_id?: number | null;
    business_card_id?: number | null;
    address_id?: number | null;
    verified?: boolean;
    created_at?: string;
    updated_at?: string;
    address?: {
        id: number;
        address_detail: string | null;
        city_id: number | null;
        state_id: number | null;
        country_id: number | null;
        city?: {
            id: number;
            code: string;
            name: string;
        } | null;
        state?: {
            id: number;
            code: string;
            name: string;
        } | null;
        country?: {
            id: number;
            code: string;
            name: string;
        } | null;
    } | null;
};

export type UpdateMePayload = {
    name?: string;
    email?: string;
    phone?: string;
    address_detail?: string;
    city?: string;
    state?: string;
    country?: string;
    password?: string;
};

function handleApiError(e: any): never {
    const msg = e?.response?.data?.message || e?.message || "Request failed";
    throw Object.assign(new Error(msg), { response: e?.response, status: e?.response?.status });
}

/** ====== Auth core ====== */
export async function login(payload: LoginPayload) {
    try {
        const res = await api.post("/auth/login", payload);
        return res.data as { token: string; verified: boolean; user: Me };
    } catch (e) {
        handleApiError(e);
    }
}

export async function register(payload: RegisterPayload) {
    try {
        const res = await api.post("/auth/register", payload);
        return res.data as { ok: true; user: Me };
    } catch (e) {
        handleApiError(e);
    }
}


/** ====== Me ====== */
export async function getMe(): Promise<Me> {
    const { data } = await api.get("/auth/me"); // Matches routes/web
    return data;
}

// BE doesn't have separate update profile endpoint -> usually PATCH /auth/me.
// If you use /user/update then modify accordingly; here we use /auth/me (PATCH).
export async function updateMe(payload: UpdateMePayload): Promise<Me> {
    const { data } = await api.patch("/auth/me", payload); // Create route if not exists
    return data as Me;
}


/** ====== Password reset flow ====== */
export async function requestPasswordReset(email: string, newPassword: string) {
    try {
        const res = await api.post("/auth/password/request", {
            email: email.trim(),
            new_password: newPassword,
        });
        return res.data as { ok: true };
    } catch (e) {
        handleApiError(e);
    }
}

export async function verifyPasswordReset(email: string, code: string) {
    try {
        const res = await api.post("/auth/password/verify", {
            email: email.trim(),
            code: code.trim(),
        });
        return res.data as { ok: true };
    } catch (e) {
        handleApiError(e);
    }
}

export async function resendPasswordCode(email: string) {
    try {
        const res = await api.post("/auth/password/resend", { email: email.trim() });
        return res.data as { ok: true };
    } catch (e) {
        handleApiError(e);
    }
}

export async function logout() {
    try {
        await api.post("/auth/logout");
    } catch (e) {
        // Ignore logout errors
    }
}
