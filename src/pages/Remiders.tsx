'use client';

import { useEffect, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import { listReminders, createReminder, deleteReminder, markReminderDone, type Reminder } from '../services/reminders';

export default function RemindersPage() {
    const reduxToken = useAppSelector(s => s.auth.token);
    const token = reduxToken || (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const [items, setItems] = useState<Reminder[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [open, setOpen] = useState(false);

    // form
    const [contactId, setContactId] = useState<number | ''>('');
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [due, setDue] = useState<string>('');

    useEffect(() => {
        setLoading(true); setErr(null);
        listReminders({ status }, token)
            .then(res => setItems(res.data))
            .catch(e => setErr(e?.message || 'Failed to load'))
            .finally(() => setLoading(false));
    }, [status, token]);

    async function create() {
        if (!contactId || !title.trim() || !due) return;
        const r = await createReminder({ contact_id: Number(contactId), title: title.trim(), note: note || null, due_at: due }, token);
        setItems(prev => [r, ...prev]);
        setOpen(false);
        setContactId(''); setTitle(''); setNote(''); setDue('');
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden"><AppNav variant="mobile" /></div>
            <AppNav variant="sidebar" />

            <main className="px-4 py-6 md:ml-64 md:px-8">
                <div className="mb-4 flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Reminders</h1>
                    <div className="flex items-center gap-2">
                        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl border bg-white px-3 py-2">
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="done">Done</option>
                            <option value="skipped">Skipped</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <button onClick={() => setOpen(true)} className="rounded-2xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                            + New
                        </button>
                    </div>
                </div>

                {err && <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{err}</div>}

                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200" />)}
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {items.map(r => (
                            <li key={r.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                                <div>
                                    <div className="font-medium">{r.title}</div>
                                    <div className="text-xs text-slate-500">Contact #{r.contact_id} • Due {new Date(r.due_at).toLocaleString()} • {r.status}</div>
                                    {r.note && <div className="mt-1 text-sm text-slate-600">{r.note}</div>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {r.status !== 'done' && (
                                        <button onClick={async () => {
                                            const nr = await markReminderDone(r.id, token);
                                            setItems(prev => prev.map(x => x.id === r.id ? nr : x));
                                        }} className="rounded-md bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700">
                                            Mark done
                                        </button>
                                    )}
                                    <button onClick={async () => {
                                        if (!confirm('Delete reminder?')) return;
                                        await deleteReminder(r.id, token);
                                        setItems(prev => prev.filter(x => x.id !== r.id));
                                    }} className="rounded-md bg-white px-3 py-1.5 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Modal tạo mới */}
                {open && (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
                        <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">New reminder</h3>
                                <button onClick={() => setOpen(false)} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                            </div>
                            <div className="space-y-3">
                                <input type="number" placeholder="Contact ID" value={contactId} onChange={e => setContactId(Number(e.target.value) || '')}
                                    className="w-full rounded-xl border px-3 py-2" />
                                <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2" />
                                <textarea placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2" rows={3} />
                                <input type="datetime-local" value={due} onChange={e => setDue(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2" />
                                <div className="flex items-center justify-end gap-2 pt-1">
                                    <button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 hover:bg-slate-50">Cancel</button>
                                    <button onClick={create} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
