// import { useState } from "react";
// import { useAppDispatch } from "../utils/hooks";
// import { requestPwReset, resendPwCode } from "../features/auth/authSlice";
// import { useNavigate } from "react-router-dom";

// export default function ForgotPassword() {
//     const [email, setEmail] = useState("");
//     const [pw, setPw] = useState("");
//     const [showPassword, setShowPassword] = useState(false);
//     const [busy, setBusy] = useState(false);
//     const [msg, setMsg] = useState<string | null>(null);
//     const dispatch = useAppDispatch();
//     const nav = useNavigate();

//     async function onSubmit(e: React.FormEvent) {
//         e.preventDefault();
//         setBusy(true); setMsg(null);
//         try {
//             await dispatch(requestPwReset({ email, newPassword: pw })).unwrap();
//             nav(`/reset-verify?email=${encodeURIComponent(email)}`, { replace: true });
//         } catch (e: any) {
//             setMsg(e?.message || "Failed to request reset.");
//         } finally { setBusy(false); }
//     }

//     return (
//         <div className="max-w-md mx-auto p-6">
//             <h2 className="text-xl font-semibold mb-3">Forgot password</h2>
//             <form onSubmit={onSubmit} className="space-y-3">
//                 <input
//                     className="w-full rounded-lg border px-3 py-2"
//                     placeholder="you@example.com"
//                     type="email"
//                     value={email} onChange={e => setEmail(e.target.value)}
//                 />
//                 <div className="relative">
//                     <input
//                         className="w-full rounded-lg border px-3 py-2 pr-10"
//                         placeholder="New password"
//                         type={showPassword ? "text" : "password"}
//                         value={pw}
//                         onChange={e => setPw(e.target.value)}
//                     />
//                     <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
//                         aria-label={showPassword ? "Hide password" : "Show password"}
//                     >
//                         {showPassword ? (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                             </svg>
//                         ) : (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                             </svg>
//                         )}
//                     </button>
//                 </div>
//                 <button disabled={busy} className="w-full rounded-lg bg-slate-900 text-white py-2">
//                     {busy ? "Sending..." : "Send code"}
//                 </button>
//             </form>

//             {msg && <div className="mt-3 text-sm text-rose-600">{msg}</div>}

//             <button
//                 className="mt-3 text-sm text-sky-600 hover:underline"
//                 onClick={async () => {
//                     if (!email) return setMsg("Enter your email first");
//                     setBusy(true);
//                     try { await dispatch(resendPwCode(email)).unwrap(); setMsg("Code re-sent."); }
//                     finally { setBusy(false); }
//                 }}
//             >
//                 Resend code
//             </button>
//         </div>
//     );
// }
