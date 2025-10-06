// src/components/home/QuickAction.tsx
'use client';
import React from 'react';

type Props = {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
};

export default function QuickAction({ icon, label, onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className="group flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md"
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="font-medium text-slate-900 group-hover:underline">{label}</div>
                <div className="text-xs text-slate-500">One tap</div>
            </div>
        </button>
    );
}
