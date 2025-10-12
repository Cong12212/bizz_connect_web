import { useState, type FormEvent } from "react";
import { useAppDispatch } from "@/utils/hooks";
import { loginThunk } from "@/features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function LoginForm({
    onSuccessRoute,
    onForgot,
}: {
    onSuccessRoute: string;
    onForgot: () => void;
}) {
    const dispatch = useAppDispatch();
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        setSubmitting(true);
        try {
            const { verified } = await dispatch(loginThunk({ email, password: pw })).unwrap();
            nav(verified ? onSuccessRoute : "/verify-email", { replace: true });
        } catch (e: any) {
            const status = e?.response?.status ?? e?.status;
            if (status === 403) return nav("/verify-email", { replace: true });
            setErr("Invalid credentials");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
                    disabled={submitting}
                />
            </label>

            <label className="block">
                <span className="flex items-center justify-between text-sm text-slate-600">Password</span>
                <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className={inputCls}
                    disabled={submitting}
                />
            </label>

            {err && <p className="text-sm text-rose-600">{err}</p>}

            <button type="button" onClick={onForgot} className="text-sky-600 hover:underline">
                Forgot password?
            </button>

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
                Sign in
            </button>
        </form>
    );
}
