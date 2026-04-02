import { useState, type FormEvent } from "react";
import { useAppDispatch } from "@/utils/hooks";
import { registerThunk } from "@/features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function SignupForm({ onSuccessRoute }: { onSuccessRoute: string }) {
    const dispatch = useAppDispatch();
    const nav = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrs, setFieldErrs] = useState<{ name?: string; email?: string; pw?: string; pw2?: string }>({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
        const fe: typeof fieldErrs = {};
        if (!name.trim()) fe.name = "Please enter your full name";
        if (!email.trim()) fe.email = "Please enter your email";
        else if (!emailRegex.test(email)) fe.email = "Invalid email format";
        if (!pw) fe.pw = "Please enter a password";
        else if (pw.length < 6) fe.pw = "Password must be at least 6 characters";
        if (!pw2) fe.pw2 = "Please confirm your password";
        else if (pw2 !== pw) fe.pw2 = "Passwords do not match";
        setFieldErrs(fe);
        return Object.keys(fe).length === 0;
    }

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        if (!validate()) return;
        setSubmitting(true);
        try {
            await dispatch(registerThunk({ name: name.trim(), email: email.trim(), password: pw })).unwrap();
            nav(onSuccessRoute, { replace: true });
        } catch (e: any) {
            // Extract error message from backend response - handle Laravel validation errors
            let msg = "Register failed";
            if (e?.response?.data?.errors) {
                // Handle Laravel validation errors - get first error message
                const errors = e.response.data.errors;
                const firstError = Object.values(errors)[0];
                if (Array.isArray(firstError) && firstError.length > 0) {
                    msg = firstError[0] as string;
                }
            } else if (e?.response?.data?.message) {
                msg = e.response.data.message;
            } else if (e?.message) {
                msg = e.message;
            }
            setErr(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <label className="block">
                <span className="text-sm text-slate-600">Full name</span>
                <input
                    required
                    autoComplete="name"
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    disabled={submitting}
                    aria-invalid={!!fieldErrs.name}
                />
                {fieldErrs.name && <p className="text-xs text-rose-600 mt-1">{fieldErrs.name}</p>}
            </label>

            <label className="block">
                <span className="text-sm text-slate-600">Work email</span>
                <input
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="jane@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    disabled={submitting}
                    aria-invalid={!!fieldErrs.email}
                />
                {fieldErrs.email && <p className="text-xs text-rose-600 mt-1">{fieldErrs.email}</p>}
            </label>

            <label className="block">
                <span className="text-sm text-slate-600">Password</span>
                <div className="relative">
                    <input
                        required
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        className={inputCls}
                        disabled={submitting}
                        aria-invalid={!!fieldErrs.pw}
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
                {fieldErrs.pw && <p className="text-xs text-rose-600 mt-1">{fieldErrs.pw}</p>}
            </label>

            <label className="block">
                <span className="text-sm text-slate-600">Confirm password</span>
                <div className="relative">
                    <input
                        required
                        type={showPw2 ? "text" : "password"}
                        autoComplete="new-password"
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        className={inputCls}
                        disabled={submitting}
                        aria-invalid={!!fieldErrs.pw2}
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
                {fieldErrs.pw2 && <p className="text-xs text-rose-600 mt-1">{fieldErrs.pw2}</p>}
            </label>

            {err && <p className="text-sm text-rose-600">{err}</p>}

            <button
                type="submit"
                disabled={submitting}
                className={`w-full rounded-xl bg-slate-900 py-3 font-semibold text-white flex items-center justify-center ${submitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
            >
                {submitting && (
                    <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
                Create account
            </button>
        </form>
    );
}
