'use client';

import React from 'react';
import type { ReminderStatus } from '@/services/reminders';

export default function ReminderFilters({
    status, setStatus,
    overdue, setOverdue,
    from, setFrom,
    to, setTo,
    contactButtonLabel,
    onOpenContactPicker,
    onClearContact,
    onOpenCreate,
}: {
    status: '' | ReminderStatus;
    setStatus: (v: '' | ReminderStatus) => void;
    overdue: boolean;
    setOverdue: (v: boolean) => void;
    from: string; setFrom: (v: string) => void;
    to: string; setTo: (v: string) => void;
    contactButtonLabel: string;
    onOpenContactPicker: () => void;
    onClearContact?: () => void;
    onOpenCreate: () => void;
}) {
    return (
        <div className="mb-3 flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold">Reminders</h1>

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="rounded-md border bg-white px-3 py-2 text-sm"
            >
                <option value="">All status</option>
                <option value="pending">pending</option>
                <option value="done">done</option>
                <option value="skipped">skipped</option>
                <option value="cancelled">cancelled</option>
            </select>

            <label className="ml-2 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />
                Overdue only
            </label>

            <div className="ml-2 flex items-center gap-2 text-sm">
                <span>From</span>
                <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border px-2 py-1" />
                <span>To</span>
                <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border px-2 py-1" />
            </div>

            <button onClick={onOpenContactPicker} className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50">
                {contactButtonLabel}
            </button>
            {onClearContact && (
                <button onClick={onClearContact} className="rounded-md border px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                    clear
                </button>
            )}

            <div className="ml-auto flex items-center gap-2">
                <button onClick={onOpenCreate} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                    New reminder
                </button>
            </div>
        </div>
    );
}
