import { useState, type FormEvent } from "react";
import { requestPasswordReset, verifyPasswordReset, resendPasswordCode } from "@/services/auth";

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function ForgotForm({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [code, setCode] = useState("");
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    // Step 1: Request reset (send email + new_password)
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
            const msg = e?.response?.data?.message || e?.message || "Failed to send code.";
            setErr(msg);
        } finally {
            setBusy(false);
        }
    }

    // Step 2: Verify code (email + code). Success => return to login
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
            const msg = e?.response?.data?.message || e?.message || "Failed to reset password.";
            setErr(msg);
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
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={pw}
                                onChange={(e) => setPw(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                disabled={busy}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                                aria-label={showPw ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPw ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-sm text-slate-600">Confirm new password</span>
                        <div className="relative">
                            <input
                                type={showPw2 ? "text" : "password"}
                                required
                                autoComplete="new-password"
                                value={pw2}
                                onChange={(e) => setPw2(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                disabled={busy}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw2(!showPw2)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                                aria-label={showPw2 ? "Hide password" : "Show password"}
                                tabIndex={-1}
                            >
                                {showPw2 ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
                                    const msg = e?.response?.data?.message || e?.message || "Cannot resend code.";
                                    setErr(msg);
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
