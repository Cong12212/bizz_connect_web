import { useState, type FormEvent } from "react";
import { requestPasswordReset, verifyPasswordReset, resendPasswordCode } from "@/services/auth";

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function ForgotForm({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [code, setCode] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // B1: yêu cầu reset (gửi email + new_password)
    async function sendCode(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);

        const em = email.trim();
        if (!em) return setErr("Please enter your email.");
        if (!pw) return setErr("Please enter new password.");
        if (pw.length < 6) return setErr("Password must be at least 6 characters.");
        if (pw !== pw2) return setErr("Passwords do not match.");

        setBusy(true);
        try {
            await requestPasswordReset(em, pw);
            setMsg("Verification code sent to your email.");
            setStep(2);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Failed to send code.");
        } finally {
            setBusy(false);
        }
    }

    // B2: xác minh mã (email + code). Thành công => quay về login
    async function confirmReset(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setMsg(null);

        if (!code.trim()) return setErr("Please enter the verification code.");

        setBusy(true);
        try {
            await verifyPasswordReset(email.trim(), code.trim());
            setMsg("Password updated. Redirecting to sign in…");
            setTimeout(onBack, 1200);
        } catch (e: any) {
            setErr(e?.response?.data?.message || e?.message || "Failed to reset password.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h4 className="text-base font-semibold">
                    {step === 1 ? "Create a new password" : "Enter verification code"}
                </h4>
                <button onClick={onBack} className="text-slate-600 hover:underline text-sm">
                    ← Back to sign in
                </button>
            </div>

            {step === 1 ? (
                <form onSubmit={sendCode} className="space-y-4">
                    <label className="block">
                        <span className="text-sm text-slate-600">Email</span>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={inputCls}
                            disabled={busy}
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-slate-600">New password</span>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            className={inputCls}
                            disabled={busy}
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-slate-600">Confirm new password</span>
                        <input
                            type="password"
                            required
                            autoComplete="new-password"
                            value={pw2}
                            onChange={(e) => setPw2(e.target.value)}
                            className={inputCls}
                            disabled={busy}
                        />
                    </label>

                    {err && <p className="text-sm text-rose-600">{err}</p>}
                    {msg && <p className="text-sm text-emerald-600">{msg}</p>}

                    <button
                        type="submit"
                        disabled={busy}
                        className={`w-full rounded-xl bg-slate-900 py-3 font-semibold text-white flex items-center justify-center ${busy ? "opacity-70 cursor-not-allowed" : ""
                            }`}
                    >
                        {busy && (
                            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        )}
                        Send code
                    </button>
                </form>
            ) : (
                <form onSubmit={confirmReset} className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        We sent a verification code to <b>{email}</b>. Enter it below to confirm your new password.
                    </div>

                    <label className="block">
                        <span className="text-sm text-slate-600">Verification code</span>
                        <input
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className={inputCls}
                            disabled={busy}
                        />
                    </label>

                    {err && <p className="text-sm text-rose-600">{err}</p>}
                    {msg && <p className="text-sm text-emerald-600">{msg}</p>}

                    <div className="flex items-center gap-2">
                        <button
                            type="submit"
                            disabled={busy}
                            className={`flex-1 rounded-xl bg-slate-900 py-3 font-semibold text-white flex items-center justify-center ${busy ? "opacity-70 cursor-not-allowed" : ""
                                }`}
                        >
                            {busy && (
                                <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            )}
                            Confirm reset
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={async () => {
                                setErr(null);
                                setMsg(null);
                                try {
                                    await resendPasswordCode(email.trim());
                                    setMsg("Code resent.");
                                } catch (e: any) {
                                    setErr(e?.response?.data?.message || e?.message || "Cannot resend code.");
                                }
                            }}
                            className="rounded-xl border px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                            Resend
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
