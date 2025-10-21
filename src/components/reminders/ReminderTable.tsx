'use client';

import type { Reminder } from '@/services/reminders';

export default function ReminderTable({
    items,
    loading,
    pageIds,
    allPageChecked,
    somePageChecked,
    onToggleAll,
    onToggleOne,
    onMarkDone,
    onEdit,
    onDelete,
    contactLabel,
}: {
    items: Reminder[];
    loading: boolean;
    pageIds: number[];
    allPageChecked: boolean;
    somePageChecked: boolean;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (id: number, checked: boolean) => void;
    onMarkDone: (id: number) => void;
    onEdit: (row: Reminder) => void;
    onDelete: (id: number) => void;
    contactLabel: (cid?: number | null) => string;
}) {

    function formatUTCAsIs(isoString: string): string {
        // Parse UTC string WITHOUT timezone conversion
        const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (!match) return isoString;

        const [, year, month, day, hour, minute] = match;
        return `${day}/${month}/${year}, ${hour}:${minute}`;
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <div className="grid grid-cols-[40px_1.1fr_1fr_1fr_150px_150px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        disabled={loading || pageIds.length === 0}
                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                        checked={allPageChecked && !loading}
                        ref={(el) => {
                            if (el) el.indeterminate = !loading && somePageChecked;
                        }}
                        onChange={(e) => onToggleAll(e.target.checked)}
                    />
                </div>
                <div>Title dmmm</div>
                <div>Contact</div>
                <div>Due at</div>
                <div>Status</div>
                <div>Actions</div>
            </div>

            {loading ? (
                <div className="p-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                    ))}
                </div>
            ) : items.length ? (
                <ul>
                    {items.map((r) => (
                        <li key={r.id} className="grid grid-cols-[40px_1.1fr_1fr_1fr_150px_150px] items-center gap-2 px-3 py-2">
                            <div>
                                <input
                                    type="checkbox"
                                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                                    onChange={(e) => onToggleOne(r.id, e.target.checked)}
                                />
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{r.title}</div>
                                <div className="truncate text-xs text-slate-500">{r.note || '—'}</div>
                            </div>
                            <div className="truncate text-sm">{contactLabel(r.contact_id)}</div>
                            <div className="min-w-0">
                                {r.due_at ? (() => {
                                    // Debug: Log ra xem due_at là gì
                                    console.log('Original due_at:', r.due_at);
                                    console.log('Type:', typeof r.due_at);

                                    const match = String(r.due_at).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
                                    console.log('Match result:', match);

                                    if (!match) return String(r.due_at);

                                    const [, year, month, day, hour, minute] = match;
                                    const formatted = `${day}/${month}/${year}, ${hour}:${minute}`;
                                    console.log('Formatted:', formatted);

                                    return (
                                        <div className="truncate">
                                            <div className="text-sm font-medium">
                                                {formatted}
                                            </div>
                                        </div>
                                    );
                                })() : '—'}
                            </div>
                            <div className="text-xs">
                                <span
                                    className={`inline-block rounded-full px-2 py-0.5 ${r.status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                        : r.status === 'done'
                                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                            : r.status === 'skipped'
                                                ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                                                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                                        }`}
                                >
                                    {r.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {r.status !== 'done' && (
                                    <button
                                        className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                        onClick={() => onMarkDone(r.id)}
                                    >
                                        Mark done
                                    </button>
                                )}
                                <button className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50" onClick={() => onEdit(r)}>
                                    Edit
                                </button>
                                <button
                                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                                    onClick={() => onDelete(r.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-sm text-slate-500">No reminders</div>
            )}
        </div>
    );
}
