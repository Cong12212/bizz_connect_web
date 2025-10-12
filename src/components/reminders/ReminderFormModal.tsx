'use client';

import React, { useEffect, useState } from 'react';
import SelectContactsModal from '@/components/contacts/SelectContactsModal';
import { listContacts, type Contact } from '@/services/contacts';
import {
    getReminder,
    createReminder,
    updateReminder,
    type Reminder,
    type ReminderStatus,
    type ReminderChannel,
} from '@/services/reminders';

export default function ReminderFormModal({
    open,
    onClose,
    token,
    mode,
    row,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    mode: 'create' | 'edit';
    row?: Reminder;
    onSaved: (r: Reminder) => void;
}) {
    const [saving, setSaving] = useState(false);

    // ===================== contacts (multi) =====================
    const [contactIds, setContactIds] = useState<number[]>(
        row ? [row.contact_id!].filter(Boolean) : [],
    );
    const primaryId = contactIds[0] ?? null;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [previewMap, setPreviewMap] = useState<Record<number, Contact>>({});

    // ===================== fields =====================
    const [title, setTitle] = useState(row?.title ?? '');
    const [note, setNote] = useState(row?.note ?? '');

    const [dueLocal, setDueLocal] = useState(isoToLocalInput(row?.due_at)); // <input type="datetime-local">

    const [status, setStatus] = useState<ReminderStatus>(row?.status ?? 'pending');
    const [channel, setChannel] = useState<ReminderChannel>('app');

    // Load đủ contacts khi edit (từ quan hệ reminder->contacts)
    useEffect(() => {
        let alive = true;
        if (mode === 'edit' && row) {
            getReminder(row.id, token)
                .then((r: any) => {
                    if (!alive) return;
                    const ids: number[] = Array.isArray(r.contacts) ? r.contacts.map((c: any) => c.id) : [];
                    setContactIds(ids.length ? ids : [row.contact_id!].filter(Boolean));
                })
                .catch(() => setContactIds([row.contact_id!].filter(Boolean)));
        }
        return () => {
            alive = false;
        };
    }, [mode, row?.id, token]);

    // Fetch preview để hiển thị chip
    useEffect(() => {
        const need = contactIds.filter((id) => !previewMap[id]);
        if (!need.length) return;

        listContacts(
            { q: '', sort: 'name', page: 1, per_page: Math.max(need.length, 100) } as any,
            token,
        )
            .then((res) => {
                const map: Record<number, Contact> = {};
                (res.data || []).forEach((c: Contact) => (map[c.id] = c));
                setPreviewMap((m) => ({ ...m, ...map }));
            })
            .catch(() => { });
    }, [contactIds.join(','), token]); // eslint-disable-line react-hooks/exhaustive-deps

    function addContacts(ids: number[]) {
        setContactIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
    function removeContact(id: number) {
        setContactIds((prev) => prev.filter((x) => x !== id));
    }
    function makePrimary(id: number) {
        setContactIds((prev) => [id, ...prev.filter((x) => x !== id)]);
    }

    // ===================== datetime helpers =====================
    function isoToLocalInput(iso?: string | null) {
        if (!iso) return '';
        const d = new Date(iso); // parse đúng vì ISO có offset/Z
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
            d.getHours(),
        )}:${pad(d.getMinutes())}`;
    }

    // <-- HÀM QUAN TRỌNG: gửi kèm offset thay vì .toISOString()
    function localInputToOffset(local: string) {
        if (!local) return null;
        const d = new Date(local); // hiểu là local-time người dùng
        const pad = (n: number) => String(n).padStart(2, '0');

        const y = d.getFullYear();
        const m = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());

        const tzMin = -d.getTimezoneOffset(); // +420 cho UTC+07
        const sign = tzMin >= 0 ? '+' : '-';
        const abs = Math.abs(tzMin);
        const tzh = pad(Math.floor(abs / 60));
        const tzm = pad(abs % 60);

        return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${tzh}:${tzm}`;
    }

    // ===================== submit =====================
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (contactIds.length === 0) return alert('Please choose at least one contact');
        if (!title.trim()) return alert('Title is required');

        setSaving(true);
        try {
            const payload: any = {
                contact_ids: contactIds,
                contact_id: contactIds[0], // primary
                title: title.trim(),
                note: note || null,
                due_at: localInputToOffset(dueLocal), // <<< dùng offset
                status,
                channel,
            };

            const saved =
                mode === 'edit' && row
                    ? await updateReminder(row.id, payload, token)
                    : await createReminder(payload, token);

            onSaved(saved);
        } catch (e: any) {
            alert(e?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <form onSubmit={handleSubmit} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-base font-semibold">{mode === 'edit' ? 'Edit reminder' : 'New reminder'}</h3>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Contacts (multi) */}
                    <div className="mb-3">
                        <label className="mb-1 block text-sm text-slate-600">Contacts</label>
                        <div className="flex flex-wrap items-center gap-2">
                            {contactIds.map((id) => {
                                const c = previewMap[id];
                                const isPrimary = id === primaryId;
                                return (
                                    <div
                                        key={id}
                                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${isPrimary ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50'
                                            }`}
                                    >
                                        <span className="max-w-[240px] truncate">
                                            {c ? `${c.name}${c.company ? ' · ' + c.company : ''}` : `#${id}`}
                                        </span>
                                        {!isPrimary && (
                                            <button
                                                type="button"
                                                className="rounded-md border px-2 py-0.5 bg-white text-slate-700"
                                                onClick={() => makePrimary(id)}
                                            >
                                                set primary
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="rounded-full px-2 py-0.5 hover:bg-rose-50 text-rose-600"
                                            onClick={() => removeContact(id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
                                onClick={() => setPickerOpen(true)}
                            >
                                Add contacts
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="mb-1 block text-sm text-slate-600">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            placeholder="Call / Meet / Send email..."
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="mb-1 block text-sm text-slate-600">Note</label>
                        <textarea
                            value={note || ''}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full rounded-md border px-3 py-2"
                            rows={3}
                        />
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm text-slate-600">Due at</label>
                            <input
                                type="datetime-local"
                                value={dueLocal}
                                onChange={(e) => setDueLocal(e.target.value)}
                                className="w-full rounded-md border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm text-slate-600">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ReminderStatus)}
                                className="w-full rounded-md border px-3 py-2"
                            >
                                <option value="pending">pending</option>
                                <option value="done">done</option>
                                <option value="skipped">skipped</option>
                                <option value="cancelled">cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="mb-1 block text-sm text-slate-600">Channel</label>
                        <select
                            value={channel}
                            onChange={(e) => setChannel(e.target.value as ReminderChannel)}
                            className="w-full rounded-md border px-3 py-2"
                        >
                            <option value="app">app</option>
                            <option value="email">email</option>
                            <option value="calendar">calendar</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-md border px-4 py-2 hover:bg-slate-50">
                            Cancel
                        </button>
                        <button
                            disabled={saving}
                            className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Picker contacts */}
            <SelectContactsModal
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                token={token}
                filters={{ q: '', sort: 'name' }}
                title="Pick contacts"
                confirmLabel="Use selected"
                onConfirm={async (ids) => {
                    addContacts(ids);
                    setPickerOpen(false);
                }}
            />
        </div>
    );
}
