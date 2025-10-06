import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import api from "../../services/api";

type User = { id: number; name: string; email: string; email_verified_at?: string | null };

type AuthState = {
    token: string | null;
    user: User | null;
    verified: boolean | null;
    status: "idle" | "loading" | "failed";
    error?: string;
};

const saved = localStorage.getItem("bc_token");
if (saved) {
    // gắn sẵn header cho axios nếu đã có token
    (api.defaults.headers as any).common = {
        ...(api.defaults.headers as any).common,
        Authorization: `Bearer ${saved}`,
    };
}

const initialState: AuthState = {
    token: saved,
    user: null,
    verified: null,
    status: "idle",
};

/* ---------------- Thunks ---------------- */

export const registerThunk = createAsyncThunk(
    "auth/register",
    async (payload: { name?: string; email: string; password: string }) => {
        const { data } = await api.post("/auth/register", payload);
        const user: User | null = (data.user as User) ?? null;
        const verified: boolean = Boolean(
            (data.verified as boolean | undefined) ?? user?.email_verified_at
        );
        return { token: data.token as string, user, verified, message: data.message as string };
    }
);


export const loginThunk = createAsyncThunk(
    "auth/login",
    async (payload: { email: string; password: string }) => {
        const { data } = await api.post("/auth/login", payload);
        const user: User = data.user;
        const verified: boolean = Boolean(
            (data.verified as boolean | undefined) ?? user?.email_verified_at
        );
        return { token: data.token as string, user, verified };
    }
);


export const meThunk = createAsyncThunk(
    "auth/me",
    async (_: void, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/auth/me");
            const user = data as User;
            const verified = !!user?.email_verified_at;
            return { user, verified };
        } catch (err: any) {
            return rejectWithValue(err?.response?.status ?? 0);
        }
    }
);

export const resendVerifyThunk = createAsyncThunk("auth/resend", async () => {
    const { data } = await api.post("/email/verification-notification");
    return data as { message?: string };
});

export const requestPwReset = createAsyncThunk(
    "auth/requestPwReset",
    async ({ email, newPassword }: { email: string; newPassword: string }) => {
        const { data } = await api.post("/auth/password/request", {
            email,
            new_password: newPassword,
        });
        return data as { message: string };
    }
);

export const resendPwCode = createAsyncThunk(
    "auth/resendPwCode",
    async (email: string) => {
        const { data } = await api.post("/auth/password/resend", { email });
        return data as { message: string };
    }
);

export const verifyPwReset = createAsyncThunk(
    "auth/verifyPwReset",
    async ({ email, code }: { email: string; code: string }) => {
        const { data } = await api.post("/auth/password/verify", { email, code });
        return data as { message: string };
    }
);

/* --------------- Slice ------------------ */

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout(state) {
            state.token = null;
            state.user = null;
            state.verified = null;
            localStorage.removeItem("bc_token");
            delete (api.defaults.headers as any).common?.Authorization;
        },
        setToken(state, action: PayloadAction<string>) {
            state.token = action.payload;
            localStorage.setItem("bc_token", action.payload);
            (api.defaults.headers as any).common = {
                ...(api.defaults.headers as any).common,
                Authorization: `Bearer ${action.payload}`,
            };
        },
        setUser(state, action: PayloadAction<User | null>) {
            state.user = action.payload;
            state.verified = !!action.payload?.email_verified_at;
        },
    },
    extraReducers: (b) => {
        // REGISTER
        b.addCase(registerThunk.pending, (s) => { s.status = "loading"; s.error = undefined; })
            .addCase(registerThunk.fulfilled, (s, a) => {
                s.status = "idle";
                s.token = a.payload.token;
                s.user = a.payload.user;
                s.verified = a.payload.verified;
                localStorage.setItem("bc_token", a.payload.token);
                (api.defaults.headers as any).common = {
                    ...(api.defaults.headers as any).common,
                    Authorization: `Bearer ${a.payload.token}`,
                };
            })
            .addCase(registerThunk.rejected, (s, a) => { s.status = "failed"; s.error = (a.error as any)?.message; });

        // LOGIN
        b.addCase(loginThunk.pending, (s) => { s.status = "loading"; s.error = undefined; })
            .addCase(loginThunk.fulfilled, (s, a) => {
                s.status = "idle";
                s.token = a.payload.token;
                s.user = a.payload.user;
                s.verified = a.payload.verified;       // ⬅️ set ngay -> không flash
                localStorage.setItem("bc_token", a.payload.token);
                (api.defaults.headers as any).common = {
                    ...(api.defaults.headers as any).common,
                    Authorization: `Bearer ${a.payload.token}`,
                };
            })
            .addCase(loginThunk.rejected, (s, a) => { s.status = "failed"; s.error = (a.error as any)?.message; });

        // ME (đồng bộ lại)
        b.addCase(meThunk.pending, (s) => { s.status = "loading"; })
            .addCase(meThunk.fulfilled, (s, a) => {
                s.status = "idle";
                s.user = a.payload.user;
                s.verified = a.payload.verified;
            })
            .addCase(meThunk.rejected, (s, a) => {
                s.status = "failed";
                if (a.payload === 401) {
                    s.token = null; s.user = null; s.verified = null;
                    localStorage.removeItem("bc_token");
                    delete (api.defaults.headers as any).common?.Authorization;
                }
            });
    },
});

export const { logout, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;
