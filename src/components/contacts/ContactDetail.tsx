import React from "react";
import type { Contact } from "../../services/contacts";

export default function ContactDetail({
    contact, onEdit, onUpdated,
}: {
    contact: Contact;
    onEdit: () => void;
    onUpdated: (c: Contact) => void;
}) {
    const fields: Array<{ key: keyof Contact; label: string; render?: (v: any) => React.ReactNode }> = [
        { key: "job_title", label: "Job Title" },
        { key: "company", label: "Company" },
        { key: "email", label: "Email", render: (v) => (v ? <a className="underline" href={`mailto:${v}`}>{v}</a> : null) },
        { key: "phone", label: "Phone", render: (v) => (v ? <a className="underline" href={`tel:${v}`}>{v}</a> : null) },
        { key: "address", label: "Address" },
        { key: "notes", label: "Notes" },
        { key: "linkedin_url", label: "LinkedIn", render: (v) => (v ? <a className="underline" target="_blank" href={v}>{v}</a> : null) },
        { key: "website_url", label: "Website", render: (v) => (v ? <a className="underline" target="_blank" href={v}>{v}</a> : null) },
    ];

    const shown = fields.filter((f) => (contact as any)[f.key]);
    const missing = fields.filter((f) => !(contact as any)[f.key]);

    return (
        <div className="mx-auto max-w-2xl px-4 md:px-0">
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-full bg-slate-200 text-lg font-semibold">
                        {initials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xl md:text-2xl font-semibold">{contact.name}</div>
                        {(contact.company || contact.job_title) && (
                            <div className="truncate text-sm text-slate-500">
                                {[contact.job_title, contact.company].filter(Boolean).join(" · ")}
                            </div>
                        )}
                        {/* tags */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {(contact.tags || []).length ? (
                                contact.tags!.map(t => (
                                    <span key={t.id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                                        #{t.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">No tags</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <button onClick={onEdit} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 md:w-auto">
                        Edit
                    </button>
                </div>
            </header>

            {shown.length ? (
                <div className="space-y-4">
                    {shown.map((f) => (
                        <FieldRow key={String(f.key)} label={f.label}>
                            {f.render ? f.render((contact as any)[f.key]) : (contact as any)[f.key]}
                        </FieldRow>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border bg-white p-6 text-center text-slate-500">
                    This contact has no detailed information yet. Click Edit to add more.
                </div>
            )}

            {missing.length ? (
                <div className="mt-8 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="mb-2 font-medium">Missing fields</div>
                    <div className="flex flex-wrap gap-2">
                        {missing.map((m) => (
                            <span key={String(m.key)} className="rounded-full border bg-white px-3 py-1">{m.label}</span>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:items-start md:gap-3">
                <div className="text-sm font-medium text-slate-600 md:col-span-1">{label}</div>
                <div className="text-sm md:col-span-2">{children}</div>
            </div>
        </div>
    );
}

function initials(name?: string) {
    if (!name) return "?";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join("");
}
