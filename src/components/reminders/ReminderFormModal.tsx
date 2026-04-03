// src/components/reminders/ReminderFormModal.tsx
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
import { useToast, Spinner } from '@/components/ui/Toast';

export default function ReminderFormModal({
    open, onClose, token, mode, row, onSaved,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    mode: 'create' | 'edit';
    row?: Reminder;
    onSaved: (r: Reminder) => void;
}) {
    const toast = useToast();
    const [saving, setSaving] = useState(false);
    const [ready, setReady] = useState(mode === 'create'); // edit => false cho tới khi fetch xong

    // ===================== contacts (multi) =====================
    const [contactIds, setContactIds] = useState<number[]>(row ? [row.contact_id!].filter(Boolean) : []);
    const primaryId = contactIds[0] ?? null;
    const [pickerOpen, setPickerOpen] = useState(false);
    const [previewMap, setPreviewMap] = useState<Record<number, Contact>>({});

    // ===================== fields =====================
    const [title, setTitle] = useState(row?.title ?? '');
    const [note, setNote] = useState(row?.note ?? '');
    const [dueLocal, setDueLocal] = useState(isoToLocalInput(row?.due_at));
    const [status, setStatus] = useState<ReminderStatus>(row?.status ?? 'pending');
    const [channel, setChannel] = useState<ReminderChannel>('app');

    // Prefetch full reminder data when editing (runs once per open)
    useEffect(() => {
        if (!open) return;
        if (mode === 'create') {
            setReady(true);
            return;
        }
        // mode === 'edit'
        let alive = true;
        setReady(false);
        (async () => {
            try {
                const full = await getReminder(row!.id, token);
                if (!alive) return;

                // set tất cả field từ server để chắc chắn dữ liệu mới nhất
                setTitle(full.title ?? '');
                setNote(full.note ?? '');
                setDueLocal(isoToLocalInput(full.due_at));
                setStatus(full.status ?? 'pending');
                setChannel(full.channel ?? 'app');

                const ids: number[] = Array.isArray((full as any).contacts)
                    ? (full as any).contacts.map((c: any) => c.id)
                    : [full.contact_id!].filter(Boolean);

                setContactIds(ids.length ? ids : [full.contact_id!].filter(Boolean));
                setReady(true);
            } catch (e: any) {
                toast.error(e?.message || 'Failed to load reminder');
                onClose();
            }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, mode, row?.id, token]);

    // Fetch contact previews for chips — only runs when ready and contactIds change
    useEffect(() => {
        if (!ready || !open) return;
        const need = contactIds.filter((id) => !previewMap[id]);
        if (!need.length) return;
        listContacts({ q: '', sort: 'name', page: 1, per_page: Math.max(need.length, 100) } as any, token)
            .then((res) => {
                const map: Record<number, Contact> = {};
                (res.data || []).forEach((c: Contact) => (map[c.id] = c));
                setPreviewMap((m) => ({ ...m, ...map }));
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, contactIds.join(','), token]);

    function addContacts(ids: number[]) {
        setContactIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
    function removeContact(id: number) {
        setContactIds((prev) => prev.filter((x) => x !== id));
    }
    function makePrimary(id: number) {
        setContactIds((prev) => [id, ...prev.filter((x) => x !== id)]);
    }

    function isoToLocalInput(iso?: string | null) {
        if (!iso) return '';

        const match = String(iso).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (!match) return '';

        const [, year, month, day, hour, minute] = match;

        // Returns format without seconds
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }
    function localInputToUTC(local: string) {
        if (!local) return null;
        // Input: "2025-10-07T09:18" → Output: "2025-10-07 09:18:00"
        return local.replace('T', ' ') + ':00';
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (contactIds.length === 0) return toast.error('Please choose at least one contact');
        if (!title.trim()) return toast.error('Title is required');

        setSaving(true);
        try {
            const payload: any = {
                contact_ids: contactIds,
                contact_id: contactIds[0],
                title: title.trim(),
                note: note || null,
                due_at: localInputToUTC(dueLocal),
                status,
                channel,
            };
            const saved =
                mode === 'edit' && row
                    ? await updateReminder(row.id, payload, token)
                    : await createReminder(payload, token);

            onSaved(saved);
            toast.success(mode === 'edit' ? 'Reminder updated' : 'Reminder created');
        } catch (e: any) {
            toast.error(e?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/30" onClick={saving ? undefined : onClose} />
            <div className="absolute inset-0 grid place-items-center p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-5 py-3">
                        <h3 className="text-base font-semibold">
                            {mode === 'edit' ? 'Edit reminder' : 'New reminder'}
                        </h3>
                        <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                    </div>

                    {/* Body */}
                    {!ready ? (
                        <div className="grid place-items-center p-10">
                            <Spinner className="h-6 w-6" />
                            <div className="mt-2 text-sm text-slate-600">Loading…</div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="max-h-[75svh] overflow-auto px-5 py-4">
                            {/* Contacts */}
                            <div className="mb-3">
                                <label className="mb-1 block text-sm text-slate-600">Contacts</label>
                                <div className="flex flex-wrap items-center gap-2">
                                    {contactIds.map((id) => {
                                        const c = previewMap[id];
                                        const isPrimary = id === primaryId;
                                        return (
                                            <div
                                                key={id}
                                                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${isPrimary ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50'}`}
                                            >
                                                <span className="max-w-60 truncate">
                                                    {c ? `${c.name}${c.company ? ' · ' + c.company : ''}` : `#${id}`}
                                                </span>
                                                {!isPrimary && (
                                                    <button type="button" className="rounded-md border px-2 py-0.5 bg-white text-slate-700"
                                                        onClick={() => makePrimary(id)}>
                                                        set primary
                                                    </button>
                                                )}
                                                <button type="button" className="rounded-full px-2 py-0.5 hover:bg-rose-50 text-rose-600"
                                                    onClick={() => removeContact(id)}>×</button>
                                            </div>
                                        );
                                    })}
                                    <button type="button" className="rounded-md border px-3 py-2 text-sm hover:bg-slate-50"
                                        onClick={() => setPickerOpen(true)}>Add contacts</button>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="mb-3">
                                <label className="mb-1 block text-sm text-slate-600">Title</label>
                                <input value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2" placeholder="Call / Meet / Send email..." required />
                            </div>

                            {/* Note */}
                            <div className="mb-3">
                                <label className="mb-1 block text-sm text-slate-600">Note</label>
                                <textarea value={note || ''} onChange={(e) => setNote(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2" rows={3} />
                            </div>

                            {/* Due + Status */}
                            <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <div className="mb-1 text-sm text-slate-600">Due at</div>
                                    <input
                                        type="datetime-local"
                                        value={dueLocal}
                                        onChange={(e) => setDueLocal(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2"
                                        step="60"
                                    />
                                </label>
                                <label className="block">
                                    <div className="mb-1 text-sm text-slate-600">Status</div>
                                    <select value={status} onChange={(e) => setStatus(e.target.value as ReminderStatus)}
                                        className="w-full rounded-md border px-3 py-2">
                                        <option value="pending">pending</option>
                                        <option value="done">done</option>
                                        <option value="skipped">skipped</option>
                                        <option value="cancelled">cancelled</option>
                                    </select>
                                </label>
                            </div>

                            {/* Channel */}
                            <label className="mb-4 block">
                                <div className="mb-1 text-sm text-slate-600">Channel</div>
                                <select value={channel} onChange={(e) => setChannel(e.target.value as ReminderChannel)}
                                    className="w-full rounded-md border px-3 py-2">
                                    <option value="app">app</option>
                                    <option value="email">email</option>
                                    <option value="calendar">calendar</option>
                                </select>
                            </label>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button type="button" onClick={onClose}
                                    className="rounded-md border px-4 py-2 hover:bg-slate-50">Cancel</button>
                                <button disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50">
                                    {saving && <Spinner className="h-4 w-4" />}
                                    {mode === 'edit' ? 'Save changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Picker contacts */}
                    <SelectContactsModal
                        open={pickerOpen}
                        onClose={() => setPickerOpen(false)}
                        token={token}
                        filters={{ q: '', sort: 'name' }}
                        title="Pick contacts (without reminders)"
                        confirmLabel="Use selected"
                        onConfirm={async (ids) => { addContacts(ids); setPickerOpen(false); }}
                        excludeIds={contactIds}
                        withoutReminder={{ enabled: true, status: 'pending' }}
                    />

                </div>
            </div>
        </div>
    );
}
