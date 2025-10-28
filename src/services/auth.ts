// src/services/auth.ts
import api from "./api";

/** ====== Types ====== */
export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };

export type Me = {
    id: number;
    name: string;
    email: string;
    verified?: boolean;
    created_at?: string;
    updated_at?: string;
};

export type UpdateMePayload = {
    name?: string;
    // mở rộng thêm field nào BE cho phép (company, avatar, v.v.)
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
export async function updateMe(payload: Partial<Pick<Me, "name" | "email">> & { password?: string }) {
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
