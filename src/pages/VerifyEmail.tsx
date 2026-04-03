import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../utils/hooks";
import { resendVerifyThunk, meThunk, logout } from "../features/auth/authSlice";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../services/api";

export default function VerifyEmail() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { token, user } = useAppSelector((s) => s.auth);
    const [msg, setMsg] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Redirect to dashboard if already verified
    useEffect(() => {
        if (user?.email_verified_at) navigate("/dashboard", { replace: true });
    }, [user, navigate]);

    // No token → redirect to auth
    if (!token) return <Navigate to="/Auth" replace />;

    const onResend = async () => {
        setMsg(null);
        setBusy(true);
        try {
            await dispatch(resendVerifyThunk()).unwrap();
            setMsg("Verification email sent.");
            setCooldown(60);
            const timer = setInterval(() => {
                setCooldown((c) => {
                    if (c <= 1) { clearInterval(timer); return 0; }
                    return c - 1;
                });
            }, 1000);
        } catch {
            setMsg("Failed to resend. Try later.");
        } finally {
            setBusy(false);
        }
    };

    const onCheck = async () => {
        setMsg(null);
        setBusy(true);
        try {
            const { user, verified } = await dispatch(meThunk()).unwrap();
            if (verified || user?.email_verified_at) {
                navigate("/dashboard", { replace: true });
                return;
            }
            setMsg("Email not yet verified — please check your inbox.");
        } finally {
            setBusy(false);
        }
    };

    const onLogout = async () => {
        setBusy(true);
        try {

            await api.post("/auth/logout");
        } catch { }
        dispatch(logout());
        setBusy(false);
        navigate("/Auth", { replace: true });
    };

    return (
        <div className="max-w-xl mx-auto p-6">
            <div className="mx-auto w-full max-w-md bg-white rounded-2xl shadow p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">Check your inbox</h3>
                <p className="text-slate-600 mb-6">
                    We sent a verification link to <b>{user?.email ?? "your email"}</b>.
                </p>

                <div className="space-y-3">
                    <a href="mailto:" className="block">
                        <button
                            className="w-full rounded-xl bg-slate-900 text-white font-semibold py-3 disabled:opacity-70"
                            disabled={busy}
                        >
                            Open email app
                        </button>
                    </a>

                    <button
                        onClick={onResend}
                        className="w-full rounded-xl bg-white border border-slate-200 py-3 font-semibold disabled:opacity-70"
                        disabled={busy || cooldown > 0}
                    >
                        {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend email"}
                    </button>

                    <button
                        onClick={onCheck}
                        className="w-full rounded-xl bg-white border border-slate-200 py-3 font-semibold disabled:opacity-70"
                        disabled={busy}
                    >
                        I verified, check again
                    </button>

                    <button
                        onClick={onLogout}
                        className="w-full rounded-xl bg-rose-600 text-white py-3 font-semibold disabled:opacity-70"
                        disabled={busy}
                    >
                        Logout
                    </button>
                </div>

                {msg && <div className="mt-3 text-sm text-slate-700">{msg}</div>}
            </div>
        </div>
    );
}
