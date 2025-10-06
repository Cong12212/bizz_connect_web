'use client';
type Props = {
    page: number;
    lastPage: number;
    onPage: (p: number) => void;
};
export default function Pagination({ page, lastPage, onPage }: Props) {
    if (lastPage <= 1) return null;
    const prev = Math.max(1, page - 1);
    const next = Math.min(lastPage, page + 1);
    return (
        <div className="mt-4 flex items-center gap-2">
            <button className="rounded-md border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => onPage(prev)}>
                ← Prev
            </button>
            <span className="text-sm text-slate-600">Page {page} / {lastPage}</span>
            <button className="rounded-md border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                disabled={page >= lastPage}
                onClick={() => onPage(next)}>
                Next →
            </button>
        </div>
    );
}
