// src/components/contacts/EditContactSheet.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Contact } from '../../services/contacts';
import { createContact, updateContact } from '../../services/contacts';
import { Spinner, useToast } from '../ui/Toast';

export default function EditContactSheet({
    open, onClose, token, contact, onSaved,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    contact: Contact | null; // null => create
    onSaved: (c: Contact) => void;
}) {
    const toast = useToast();
    const [form, setForm] = useState<Partial<Contact>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(contact || {});
    }, [contact, open]);

    const set = (k: keyof Contact, v: any) => setForm((f) => ({ ...f, [k]: v }));

    // client-side validate URL lightly to avoid annoying 422
    function okURL(v?: string | null) {
        if (!v) return true;
        try { new URL(v); return true; } catch { return false; }
    }

    const save = async () => {
        const payload = {
            name: form.name?.trim() || '(No name)',
            job_title: form.job_title || null,
            company: form.company || null,
            email: form.email || null,
            phone: form.phone || null,
            address: form.address || null,
            notes: form.notes || null,
            linkedin_url: form.linkedin_url || null,
            website_url: form.website_url || null,
            source: form.source || undefined,
        } as any;

        if (!okURL(payload.linkedin_url)) {
            toast.error('LinkedIn must be a valid URL (e.g. https://linkedin.com/in/...)', 'Invalid data');
            return;
        }
        if (!okURL(payload.website_url)) {
            toast.error('Website must be a valid URL (e.g. https://example.com)', 'Invalid data');
            return;
        }

        setSaving(true);
        try {
            const saved = contact
                ? await updateContact(contact.id, payload, token)
                : await createContact(payload, token);

            toast.success(contact ? 'Contact changes saved.' : 'New contact created successfully.');
            onSaved(saved);
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.message ||
                'Unable to save contact. Please try again.';
            toast.error(msg, 'API 422');
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex">
            {/* backdrop only on desktop to close sheet */}
            <div className="hidden flex-1 bg-black/20 md:block" onClick={onClose} />
            <div className="relative ml-auto h-full w-full max-w-xl overflow-y-auto border-l bg-white p-6 shadow-2xl">
                {/* Saving overlay */}
                {saving && (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-white/60 backdrop-blur-sm">
                        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-slate-700 shadow">
                            <Spinner />
                            <span>Saving…</span>
                        </div>
                    </div>
                )}

                <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">
                        {contact ? 'Edit contact' : 'New contact'}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
                        disabled={saving}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Input label="Name" value={form.name || ''} onChange={(v) => set('name', v)} required disabled={saving} />
                    <Input label="Job Title" value={form.job_title || ''} onChange={(v) => set('job_title', v)} disabled={saving} />
                    <Input label="Company" value={form.company || ''} onChange={(v) => set('company', v)} disabled={saving} />
                    <Input label="Email" type="email" value={form.email || ''} onChange={(v) => set('email', v)} disabled={saving} />
                    <Input label="Phone" value={form.phone || ''} onChange={(v) => set('phone', v)} disabled={saving} />
                    <Input label="Address" value={form.address || ''} onChange={(v) => set('address', v)} disabled={saving} />
                    <TextArea label="Notes" value={form.notes || ''} onChange={(v) => set('notes', v)} disabled={saving} />

                    <div className="mt-2 text-sm font-medium">Links</div>
                    <Input
                        label="LinkedIn"
                        placeholder="https://linkedin.com/in/..."
                        value={form.linkedin_url || ''}
                        onChange={(v) => set('linkedin_url', v)}
                        disabled={saving}
                    />
                    <Input
                        label="Website"
                        placeholder="https://example.com"
                        value={form.website_url || ''}
                        onChange={(v) => set('website_url', v)}
                        disabled={saving}
                    />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="rounded-xl px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {saving && <Spinner />}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Input({
    label, value, onChange, type = 'text', required = false, placeholder, disabled = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">
                {label}{required && <span className="text-rose-600"> *</span>}
            </div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
            />
        </label>
    );
}

function TextArea({
    label, value, onChange, disabled = false,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; }) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">{label}</div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                disabled={disabled}
                className="w-full resize-y rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
            />
        </label>
    );
}
