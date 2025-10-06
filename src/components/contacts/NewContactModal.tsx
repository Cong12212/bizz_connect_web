// src/components/contacts/NewContactModal.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Contact } from '../../services/contacts';
import { createContact } from '../../services/contacts';

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated: (c: Contact) => void;
    token: string;
};

export default function NewContactModal({ open, onClose, onCreated, token }: Props) {
    const [form, setForm] = useState<Partial<Contact>>({ name: '' });
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setForm({ name: '', email: '', phone: '', company: '', address: '', notes: '' });
            setErr(null);
        }
    }, [open]);

    if (!open) return null;

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name?.trim()) { setErr('Name is required'); return; }
        setBusy(true);
        try {
            const created = await createContact(form, token);
            onCreated(created);
            onClose();
        } catch (e: any) {
            setErr(e?.message || 'Failed to create');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add new contact</h3>
                    <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Name *</label>
                        <input
                            className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Company</label>
                            <input
                                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                                value={form.company || ''}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Email</label>
                            <input
                                type="email"
                                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                                value={form.email || ''}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Phone</label>
                            <input
                                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                                value={form.phone || ''}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Address</label>
                            <input
                                className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                                value={form.address || ''}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Notes</label>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl border px-3 py-2 focus:ring-2 focus:ring-slate-300"
                            value={form.notes || ''}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    {err && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{err}</div>}

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50">Cancel</button>
                        <button type="submit" disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60">
                            {busy ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
