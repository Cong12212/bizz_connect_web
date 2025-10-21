'use client';

import type { ReminderEdge } from '@/services/reminders';

export default function ReminderPivotTable({
    items, loading, pageKeys, allPageChecked, somePageChecked,
    onToggleAll, onToggleOne, onMarkDone, onDetach, onDeleteReminder,
}: {
    items: ReminderEdge[];
    loading: boolean;
    pageKeys: string[];                 // edge_key[]
    allPageChecked: boolean;
    somePageChecked: boolean;
    onToggleAll: (checked: boolean) => void;
    onToggleOne: (edgeKey: string, checked: boolean) => void;
    onMarkDone: (reminderId: number) => void;         // áp dụng cho reminder
    onDetach: (edge: ReminderEdge) => void;           // detach 1 edge
    onDeleteReminder: (reminderId: number) => void;   // xoá cả reminder
}) {
    return (
        <div className="overflow-hidden rounded-xl border bg-white">
            <div className="grid grid-cols-[40px_1.1fr_1fr_1fr_150px_220px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        aria-label="Select all on this page"
                        disabled={loading || pageKeys.length === 0}
                        className="disabled:opacity-50"
                        checked={allPageChecked && !loading}
                        ref={(el) => { if (el) el.indeterminate = !loading && somePageChecked; }}
                        onChange={(e) => onToggleAll(e.target.checked)}
                    />
                </div>
                <div>Title</div>
                <div>Contact</div>
                <div>Due at</div>
                <div>Status</div>
                <div>Actions</div>
            </div>

            {loading ? (
                <div className="p-3">{Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                ))}</div>
            ) : items.length ? (
                <ul>
                    {items.map((e) => (
                        <li key={e.edge_key} className="grid grid-cols-[40px_1.1fr_1fr_1fr_150px_220px] items-center gap-2 px-3 py-2">
                            <div>
                                <input type="checkbox" onChange={(ev) => onToggleOne(e.edge_key, ev.target.checked)} />
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{e.title}</div>
                                <div className="truncate text-xs text-slate-500">{e.is_primary ? 'Primary contact' : '—'}</div>
                            </div>
                            <div className="truncate text-sm">
                                {e.contact_name}{e.contact_company ? ` · ${e.contact_company}` : ''}
                            </div>
                            <div className="truncate text-sm">{e.due_at ? new Date(e.due_at).toLocaleString() : '—'}</div>
                            <div className="text-xs">
                                <span className={`inline-block rounded-full px-2 py-0.5 ${e.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                    : e.status === 'done'
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                        : e.status === 'skipped'
                                            ? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                                            : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                                    }`}>{e.status}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {e.status !== 'done' && (
                                    <button className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                        onClick={() => onMarkDone(e.reminder_id)}>Mark done</button>
                                )}
                                <button className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                    onClick={() => onDetach(e)}>Detach</button>
                                <button className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700 hover:bg-rose-100"
                                    onClick={() => onDeleteReminder(e.reminder_id)}>Delete reminder</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-sm text-slate-500">No results</div>
            )}
        </div>
    );
}
