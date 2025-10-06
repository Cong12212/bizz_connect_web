'use client';
export default function TagPill({ name }: { name: string }) {
    return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
            {name}
        </span>
    );
}
