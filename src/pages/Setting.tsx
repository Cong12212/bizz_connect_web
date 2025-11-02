// src/app/settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import { useAppSelector, useAppDispatch } from "@/utils/hooks";
import { getMe, updateMe, type Me } from "@/services/auth";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "@/services/api";
import { logout } from "@/features/auth/authSlice";
import CompanySettings from "@/components/settings/CompanySettings";
import BusinessCardSettings from "@/components/settings/BusinessCardSettings";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
    const toast = useToast();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken || (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [me, setMe] = useState<Me | null>(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [country, setCountry] = useState("");

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
                setPhone(u.phone ?? "");
                setAddressDetail(u.address?.address_detail ?? "");
                setCity(u.address?.city?.code ?? "");
                setState(u.address?.state?.code ?? "");
                setCountry(u.address?.country?.code ?? "");
            })
            .catch((e) => setErr(e?.message || "Failed to load user"))
            .finally(() => setLoading(false));
        return () => { alive = false; };
    }, [token]);

    async function onSave(e: React.FormEvent) {
        e.preventDefault();
        if (!me) return;

        setSaving(true);
        setErr(null);
        try {
            const updated = await updateMe({
                name,
                email,
                phone,
                address_detail: addressDetail,
                city,
                state,
                country,
            });
            setMe(updated);
            toast.success("Profile updated!");
        } catch (e: any) {
            setErr(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function onLogout() {
        try { await logout(); } catch { }
        if (typeof window !== "undefined") localStorage.removeItem("bc_token");
        setAuthToken('');
        dispatch(logout());
        navigate("/auth", { replace: true });
    }

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />
            <main className="md:ml-64 h-screen overflow-y-auto">
                <div className="mx-auto max-w-4xl p-4 pb-20">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold">Settings</h1>
                        <p className="text-sm text-slate-600">Manage your profile, company, and business card</p>
                    </div>

                    {err && <div className="mb-4 rounded-md bg-rose-50 p-3 text-rose-700">{err}</div>}

                    <div className="space-y-6">
                        {/* Profile Section */}
                        <div className="overflow-hidden rounded-xl border bg-white">
                            <div className="border-b bg-slate-50 px-4 py-3">
                                <h2 className="text-sm font-semibold text-slate-900">Profile Information</h2>
                                <p className="text-xs text-slate-600">Update your personal details</p>
                            </div>

                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="h-10 animate-pulse rounded-md bg-slate-200" />
                                    ))}
                                </div>
                            ) : me ? (
                                <form onSubmit={onSave} className="p-4 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                                        <input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={onLogout}
                                            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                                        >
                                            Log out
                                        </button>
                                        <button
                                            disabled={saving}
                                            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                                        >
                                            {saving ? "Saving..." : "Save Profile"}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-4 text-sm text-slate-500">No user data.</div>
                            )}
                        </div>

                        {/* Company Section */}
                        <div>
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold text-slate-900">Company</h2>
                                <p className="text-sm text-slate-600">Manage your company information</p>
                            </div>
                            <CompanySettings />
                        </div>

                        {/* Business Card Section */}
                        <div>
                            <div className="mb-3">
                                <h2 className="text-lg font-semibold text-slate-900">Business Card</h2>
                                <p className="text-sm text-slate-600">Create and manage your digital business card</p>
                            </div>
                            <BusinessCardSettings />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
