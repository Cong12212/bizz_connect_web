import React, { useEffect, useState } from "react";
import type { Contact } from "../../services/contacts";
import { createContact, updateContact } from "../../services/contacts";

export default function EditContactSheet({
    open, onClose, token, contact, onSaved,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    contact: Contact | null; // null => create
    onSaved: (c: Contact) => void;
}) {
    const [form, setForm] = useState<Partial<Contact>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => { setForm(contact || {}); }, [contact, open]);

    const set = (k: keyof Contact, v: any) => setForm((f) => ({ ...f, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                name: form.name?.trim() || "(No name)",
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
            const saved = contact
                ? await updateContact(contact.id, payload, token)
                : await createContact(payload, token);
            onSaved(saved);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex">
            <div className="hidden flex-1 bg-black/20 md:block" onClick={onClose} />
            <div className="ml-auto h-full w-full max-w-xl overflow-y-auto border-l bg-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">{contact ? "Edit contact" : "New contact"}</div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">✕</button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <Input label="Name" value={form.name || ""} onChange={(v) => set("name", v)} required />
                    <Input label="Job Title" value={form.job_title || ""} onChange={(v) => set("job_title", v)} />
                    <Input label="Company" value={form.company || ""} onChange={(v) => set("company", v)} />
                    <Input label="Email" type="email" value={form.email || ""} onChange={(v) => set("email", v)} />
                    <Input label="Phone" value={form.phone || ""} onChange={(v) => set("phone", v)} />
                    <Input label="Address" value={form.address || ""} onChange={(v) => set("address", v)} />
                    <TextArea label="Notes" value={form.notes || ""} onChange={(v) => set("notes", v)} />

                    <div className="mt-2 text-sm font-medium">Links</div>
                    <Input label="LinkedIn" value={form.linkedin_url || ""} onChange={(v) => set("linkedin_url", v)} placeholder="https://linkedin.com/in/..." />
                    <Input label="Website" value={form.website_url || ""} onChange={(v) => set("website_url", v)} placeholder="https://example.com" />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl px-4 py-2 hover:bg-slate-100">Cancel</button>
                    <button
                        onClick={save}
                        disabled={saving}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Input({ label, value, onChange, type = "text", required = false, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">{label}{required && <span className="text-rose-600"> *</span>}</div>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                type={type}
                placeholder={placeholder}
                className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            />
        </label>
    );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">{label}</div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
            />
        </label>
    );
}
