import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ForgotForm from "@/components/auth/ForgotForm";

type Mode = "login" | "signup" | "forgot";

export default function AuthPortal() {
    const [mode, setMode] = useState<Mode>("login");
    const toggle = () => setMode((m) => (m === "login" ? "signup" : "login"));

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 lg:p-6">
            <div className="relative w-[95vw] max-w-[1400px] lg:h-[78vh] lg:min-h-[640px] lg:max-h-[860px] rounded-[28px] shadow-2xl overflow-hidden bg-white">
                <div className="grid h-full grid-cols-1 lg:grid-cols-[58%_42%]">
                    {/* LEFT */}
                    <section className="relative grid place-items-center p-8 lg:p-10 text-white bg-gradient-to-br from-[#0f172a] via-[#d9d6ff] to-[#685454]">
                        <div className="pointer-events-none absolute -left-10 top-16 h-32 w-32 rotate-12 rounded-2xl bg-white/5 blur-[1px]" />
                        <div className="pointer-events-none absolute left-40 top-40 h-24 w-24 -rotate-12 rounded-2xl bg-white/5 blur-[1px]" />
                        <div className="pointer-events-none absolute left-24 bottom-16 h-28 w-28 rotate-6 rounded-2xl bg-white/5 blur-[1px]" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <motion.img
                                src="/bizzconnect.png"
                                alt="Biz-Connect logo"
                                className="select-none pointer-events-none object-contain h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56 xl:h-64 xl:w-64 [filter:drop-shadow(0_10px_24px_rgba(0,0,0,.25))]"
                                initial={{ y: 0, rotate: 0, scale: 1 }}
                                animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0, 1.5, 0] }}
                                transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
                                whileHover={{ scale: 1.04 }}
                            />
                            <h1 className="mt-6 text-3xl md:text-4xl font-bold drop-shadow-sm">Biz-Connect</h1>
                            <p className="mt-3 max-w-md text-white/90 hidden sm:block">
                                Manage & connect business contacts, set follow-up reminders, and sync email/calendar — all in one place.
                            </p>
                        </div>
                    </section>

                    {/* RIGHT */}
                    <section className="bg-white p-6 sm:p-8 lg:p-10">
                        <div className="mb-6">
                            <h3 className="text-center text-lg font-semibold">
                                {mode === "login"
                                    ? "User Login"
                                    : mode === "signup"
                                        ? "Create your account"
                                        : "Reset your password"}
                            </h3>
                        </div>

                        <div className="relative min-h-[420px]">
                            <AnimatePresence mode="wait">
                                {mode === "login" && (
                                    <motion.div
                                        key="login"
                                        initial={{ x: 40, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -40, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                        className="absolute inset-0"
                                    >
                                        <LoginForm
                                            onSuccessRoute="/dashboard"
                                            onForgot={() => setMode("forgot")}
                                        />
                                        <div className="mt-4 text-center text-sm">
                                            <button onClick={toggle} className="text-sky-600 hover:underline">
                                                No account? Create one
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {mode === "signup" && (
                                    <motion.div
                                        key="signup"
                                        initial={{ x: 40, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -40, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                        className="absolute inset-0"
                                    >
                                        <SignupForm onSuccessRoute="/verify-email" />
                                        <div className="mt-4 text-center text-sm">
                                            <button
                                                onClick={() => setMode("login")}
                                                className="text-sky-600 hover:underline"
                                            >
                                                Already have an account? Sign in
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {mode === "forgot" && (
                                    <motion.div
                                        key="forgot"
                                        initial={{ x: 40, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: -40, opacity: 0 }}
                                        transition={{ duration: 0.35, ease: "easeOut" }}
                                        className="absolute inset-0"
                                    >
                                        <ForgotForm onBack={() => setMode("login")} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
