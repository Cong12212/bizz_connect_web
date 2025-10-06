import { useState } from "react";
import { useAppDispatch } from "../utils/hooks";
import { requestPwReset, resendPwCode } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const nav = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setMsg(null);
        try {
            await dispatch(requestPwReset({ email, newPassword: pw })).unwrap();
            nav(`/reset-verify?email=${encodeURIComponent(email)}`, { replace: true });
        } catch (e: any) {
            setMsg(e?.message || "Failed to request reset.");
        } finally { setBusy(false); }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-3">Forgot password</h2>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="you@example.com"
                    type="email"
                    value={email} onChange={e => setEmail(e.target.value)}
                />
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="New password"
                    type="password"
                    value={pw} onChange={e => setPw(e.target.value)}
                />
                <button disabled={busy} className="w-full rounded-lg bg-slate-900 text-white py-2">
                    {busy ? "Sending..." : "Send code"}
                </button>
            </form>

            {msg && <div className="mt-3 text-sm text-rose-600">{msg}</div>}

            <button
                className="mt-3 text-sm text-sky-600 hover:underline"
                onClick={async () => {
                    if (!email) return setMsg("Enter your email first");
                    setBusy(true);
                    try { await dispatch(resendPwCode(email)).unwrap(); setMsg("Code re-sent."); }
                    finally { setBusy(false); }
                }}
            >
                Resend code
            </button>
        </div>
    );
}
