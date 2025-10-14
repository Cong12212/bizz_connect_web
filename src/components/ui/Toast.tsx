// src/components/ui/Toast.tsx
'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; kind: ToastKind; title?: string; message: string; duration?: number };

const ToastCtx = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);

    const api = useMemo(() => ({
        push: (t: Omit<ToastItem, 'id'>) => {
            const id = Date.now() + Math.random();
            const dur = t.duration ?? 3200;
            setItems((xs) => [...xs, { ...t, id }]);
            setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), dur);
        },
    }), []);

    return (
        <ToastCtx.Provider value={api}>
            {children}
            {/* host */}
            <div className="pointer-events-none fixed inset-x-0 top-3 z-[9999] mx-auto flex max-w-[560px] flex-col gap-2 px-3 sm:top-4 sm:right-4 sm:left-auto sm:mx-0">
                {items.map((t) => (
                    <div
                        key={t.id}
                        className={[
                            'pointer-events-auto relative w-full overflow-hidden rounded-xl border p-3 pr-10 text-sm shadow-xl backdrop-blur',
                            t.kind === 'success' && 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
                            t.kind === 'error' && 'border-rose-200 bg-rose-50/90 text-rose-900',
                            t.kind === 'info' && 'border-sky-200 bg-sky-50/90 text-sky-900',
                            'animate-[toast-in_.18s_ease-out]',
                        ].join(' ')}
                    >
                        {t.title && <div className="mb-0.5 font-semibold">{t.title}</div>}
                        <div>{t.message}</div>
                    </div>
                ))}
            </div>

            {/* keyframes */}
            <style>{`
        @keyframes toast-in { from { transform: translateY(-6px); opacity: .0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
        </ToastCtx.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error('ToastProvider is missing');
    const push = ctx.push;

    return {
        success: (msg: string, title?: string) => push({ kind: 'success', message: msg, title }),
        error: (msg: string, title?: string) => push({ kind: 'error', message: msg, title }),
        info: (msg: string, title?: string) => push({ kind: 'info', message: msg, title }),
    };
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" fill="none" />
            <path d="M4 12a8 8 0 0 1 8-8" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
    );
}
