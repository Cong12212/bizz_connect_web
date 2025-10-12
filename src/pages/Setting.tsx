// src/app/settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import { useAppSelector } from "@/utils/hooks";
import { getMe, updateMe, logout, type Me } from "@/services/auth";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
    const navigate = useNavigate();

    // vẫn lấy token nếu bạn muốn dùng chỗ khác, nhưng services không cần truyền vào
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [me, setMe] = useState<Me | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setErr(null);
        getMe()
            .then((u) => {
                if (!alive) return;
                setMe(u);
                setName(u.name ?? "");
                setEmail(u.email ?? "");
            })
            .catch((e) => setErr(e?.message || "Failed to load user"))
            .finally(() => setLoading(false));
        return () => {
            alive = false;
        };
    }, [token]);

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        if (!me) return;

        setSaving(true);
        setErr(null);
        try {
            const payload: any = { name, email };
            if (password.trim()) payload.password = password.trim();
            const updated = await updateMe(payload);
            setMe(updated);
            setPassword("");
            alert("Saved!");
        } catch (e: any) {
            setErr(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function onLogout() {
        try {
            await logout();
        } catch {

        }

        if (typeof window !== "undefined") localStorage.removeItem("bc_token");

        navigate("/auth", { replace: true });
    }

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="md:ml-64 h-screen overflow-y-auto p-4">
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-4 text-lg font-semibold">Settings</h1>

                    {err && <div className="mb-3 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>}

                    <div className="overflow-hidden rounded-xl border bg-white">
                        <div className="border-b bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                            Profile
                        </div>

                        {loading ? (
                            <div className="p-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="mb-2 h-10 animate-pulse rounded-md bg-slate-200" />
                                ))}
                            </div>
                        ) : me ? (
                            <form onSubmit={onSave} className="p-4 space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={onLogout}
                                        className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-rose-700 hover:bg-rose-100"
                                    >
                                        Log out
                                    </button>
                                    <button
                                        disabled={saving}
                                        className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
                                    >
                                        {saving ? "Saving..." : "Save changes"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 text-sm text-slate-500">No user data.</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
