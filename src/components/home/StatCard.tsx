// src/components/home/StatCard.tsx
'use client';
import React from 'react';

type Props = {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    hint?: string;
};

export default function StatCard({ icon, label, value, hint }: Props) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-2xl font-semibold text-slate-900 leading-none">{value}</div>
                    <div className="text-xs text-slate-500">{label}</div>
                </div>
            </div>
            {hint && <div className="mt-3 text-xs text-slate-500">{hint}</div>}
        </div>
    );
}
