import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../utils/hooks";
import { verifyPwReset } from "../features/auth/authSlice";

export default function ResetVerify() {
    const [sp] = useSearchParams();
    const email = sp.get("email") || "";
    const [code, setCode] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const dispatch = useAppDispatch();
    const nav = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setMsg(null);
        try {
            await dispatch(verifyPwReset({ email, code })).unwrap();
            setMsg("Password reset. Please sign in.");
            setTimeout(() => nav("/Auth", { replace: true }), 900);
        } catch (e: any) {
            setMsg(e?.message || "Verification failed");
        } finally { setBusy(false); }
    }

    return (
        <div className="max-w-md mx-auto p-6">
            <h2 className="text-xl font-semibold mb-3">Verify reset code</h2>
            <p className="text-sm text-slate-600 mb-3">
                We sent a 6-digit code to <b>{email || "your email"}</b>.
            </p>
            <form onSubmit={onSubmit} className="space-y-3">
                <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="6-digit code"
                    inputMode="numeric"
                    value={code} onChange={e => setCode(e.target.value)}
                />
                <button disabled={busy} className="w-full rounded-lg bg-slate-900 text-white py-2">
                    {busy ? "Verifying..." : "Confirm & Update password"}
                </button>
            </form>
            {msg && <div className="mt-3 text-sm">{msg}</div>}
            <Link className="text-sm text-sky-600 hover:underline" to="/forgot-password">Start over</Link>
        </div>
    );
}
