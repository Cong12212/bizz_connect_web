import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Home, AppWindow } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../utils/hooks";
import { meThunk } from "../features/auth/authSlice";

export default function VerifySuccess() {
    const [sp] = useSearchParams();
    const email = sp.get("email") || "";
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { token, user } = useAppSelector(s => s.auth);

    // refresh profile nếu có token → state verified cập nhật
    useEffect(() => {
        if (token) void dispatch(meThunk());
    }, [token, dispatch]);

    return (
        <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <div className="flex justify-center mb-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600" aria-hidden />
                </div>
                <h1 className="text-center text-xl font-semibold">Email verified</h1>
                <p className="mt-2 text-center text-slate-600">
                    {email ? <>Tài khoản <b>{email}</b> đã được xác minh thành công.</> : "Tài khoản của bạn đã được xác minh thành công."}
                </p>

                {user?.email_verified_at && (
                    <p className="mt-1 text-center text-emerald-700 text-sm">Trạng thái đã cập nhật trong ứng dụng.</p>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800"
                    >
                        <AppWindow className="h-4 w-4" /> Về ứng dụng
                    </Link>

                    {/* Nếu bạn có landing page riêng, đổi href dưới đây.
             Không có thì cho về trang chủ của app luôn. */}
                    <a
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold hover:bg-slate-50"
                    >
                        <Home className="h-4 w-4" /> Về trang chủ
                    </a>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 w-full text-center text-sm text-slate-500 hover:underline"
                >
                    Quay lại trang trước
                </button>
            </div>
        </div>
    );
}
