// src/components/contacts/EditContactSheet.tsx
'use client';

import { useEffect, useState } from 'react';
import type { Contact } from '../../services/contacts';
import { createContact, updateContact } from '../../services/contacts';
import { Spinner, useToast } from '../ui/Toast';
import CountrySelect from '../settings/CountrySelect';
import StateSelect from '../settings/StateSelect';
import CitySelect from '../settings/CitySelect';

export default function EditContactSheet({
    open, onClose, token, contact, onSaved, initialForm,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    contact: Contact | null;
    onSaved: (c: Contact) => void;
    initialForm?: Partial<Record<string, any>>;
}) {
    const toast = useToast();
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (contact) {
            setForm({
                ...contact,
                address_detail: contact.address?.address_detail || "",
                city: contact.address?.city?.code || "",
                state: contact.address?.state?.code || "",
                country: contact.address?.country?.code || "",
            });
        } else {
            // ⬇️ nếu tạo mới, dùng prefill từ navigate state (nếu có)
            setForm({
                ...(initialForm || {}),
                address_detail: initialForm?.address_detail ?? "",
                country: initialForm?.country ?? "",
                state: initialForm?.state ?? "",
                city: initialForm?.city ?? "",
            });
        }
    }, [contact, open, initialForm]);

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

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
            address_detail: form.address_detail || null,
            city: form.city || null,
            state: form.state || null,
            country: form.country || null,
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
            const saved = contact?.id
                ? await updateContact(contact.id, payload, token)
                : await createContact(payload, token);

            toast.success(contact?.id ? 'Contact changes saved.' : 'New contact created successfully.');
            onSaved(saved);
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Unable to save contact. Please try again.';
            toast.error(msg, 'API Error');
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
                        {contact?.id ? 'Edit contact' : 'New contact'}
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

                {/* Show source badge if from business card */}
                {form.source === 'business_card' && (
                    <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-900">
                            📇 <span className="font-medium">Imported from Business Card</span>
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    <Input label="Name" value={form.name || ''} onChange={(v) => set('name', v)} required disabled={saving} />
                    <Input label="Job Title" value={form.job_title || ''} onChange={(v) => set('job_title', v)} disabled={saving} />
                    <Input label="Company" value={form.company || ''} onChange={(v) => set('company', v)} disabled={saving} />
                    <Input label="Email" type="email" value={form.email || ''} onChange={(v) => set('email', v)} disabled={saving} />
                    <Input label="Phone" value={form.phone || ''} onChange={(v) => set('phone', v)} disabled={saving} />

                    <div className="border-t pt-4 mt-2">
                        <div className="mb-2 text-sm font-medium">Address</div>
                        <div className="space-y-3">
                            <Input
                                label="Street Address"
                                value={form.address_detail || ''}
                                onChange={(v) => set('address_detail', v)}
                                placeholder="123 Nguyễn Huệ, Phường Bến Nghé, Quận 1"
                                disabled={saving}
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Country</label>
                                    <CountrySelect
                                        value={form.country ?? ''}
                                        onChange={(v) => {
                                            set('country', v);
                                            set('state', '');
                                            set('city', '');
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Province/State</label>
                                    <StateSelect
                                        country={form.country ?? ''}
                                        value={form.state ?? ''}
                                        onChange={(v) => {
                                            set('state', v);
                                            set('city', '');
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">City/District</label>
                                    <CitySelect
                                        state={form.state ?? ''}
                                        value={form.city ?? ''}
                                        onChange={(v) => set('city', v)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

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
