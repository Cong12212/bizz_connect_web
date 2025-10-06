import { useState, type FormEvent } from "react";
import { useAppDispatch } from "@/utils/hooks";
import { registerThunk } from "@/features/auth/authSlice";
import { useNavigate } from "react-router-dom";

const inputCls =
    "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300";

export default function SignupForm({ onSuccessRoute }: { onSuccessRoute: string }) {
    const dispatch = useAppDispatch();
    const nav = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrs, setFieldErrs] = useState<{ name?: string; email?: string; pw?: string; pw2?: string }>({});

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function validate() {
        const fe: typeof fieldErrs = {};
        if (!name.trim()) fe.name = "Vui lòng nhập họ tên";
        if (!email.trim()) fe.email = "Vui lòng nhập email";
        else if (!emailRegex.test(email)) fe.email = "Email không hợp lệ";
        if (!pw) fe.pw = "Vui lòng nhập mật khẩu";
        else if (pw.length < 6) fe.pw = "Mật khẩu tối thiểu 6 ký tự";
        if (!pw2) fe.pw2 = "Vui lòng nhập xác nhận mật khẩu";
        else if (pw2 !== pw) fe.pw2 = "Mật khẩu nhập lại không khớp";
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
            nav(onSuccessRoute, { replace: true }); // -> /verify-email
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || "Register failed";
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
                    className={inputCls}
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
                    className={inputCls}
                    disabled={submitting}
                    aria-invalid={!!fieldErrs.email}
                />
                {fieldErrs.email && <p className="text-xs text-rose-600 mt-1">{fieldErrs.email}</p>}
            </label>

            <label className="block">
                <span className="text-sm text-slate-600">Password</span>
                <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className={inputCls}
                    disabled={submitting}
                    aria-invalid={!!fieldErrs.pw}
                />
                {fieldErrs.pw && <p className="text-xs text-rose-600 mt-1">{fieldErrs.pw}</p>}
            </label>

            <label className="block">
                <span className="text-sm text-slate-600">Confirm password</span>
                <input
                    required
                    type="password"
                    autoComplete="new-password"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className={inputCls}
                    disabled={submitting}
                    aria-invalid={!!fieldErrs.pw2}
                />
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
