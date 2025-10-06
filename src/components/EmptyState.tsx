// src/components/EmptyState.tsx
'use client';

export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="rounded-2xl border border-dashed p-8 text-center text-slate-500">
            <div className="mb-2 font-medium">{title}</div>
            {subtitle && <div className="text-sm">{subtitle}</div>}
        </div>
    );
}
