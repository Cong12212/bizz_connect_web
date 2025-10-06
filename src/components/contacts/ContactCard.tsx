// src/components/contacts/ContactCard.tsx
'use client';

import type { Contact } from '../../services/contacts';
import ContactTagManager from './ContactTagManager';

type Props = {
    c: Contact;
    token: string;
    onUpdated: (c: Contact) => void;
};

function initialLetter(name?: string | null) {
    const s = (name || '').trim();
    return s ? s[0]!.toUpperCase() : '?';
}

export default function ContactCard({ c, token, onUpdated }: Props) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            {/* header */}
            <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700 ring-1 ring-sky-200">
                    {initialLetter(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <div className="truncate font-semibold">{c.name}</div>
                        {c.company && (
                            <span className="truncate rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                                {c.company}
                            </span>
                        )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                        {c.email && <span className="mr-3">✉️ {c.email}</span>}
                        {c.phone && <span>📞 {c.phone}</span>}
                    </div>
                </div>

                {/* Tag manager trigger */}
                <ContactTagManager contact={c} token={token} onUpdated={onUpdated} />
            </div>

            {/* tag row */}
            <div className="mt-3 flex flex-wrap gap-1.5">
                {(c.tags || []).length ? (
                    c.tags!.map(t => (
                        <span key={t.id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                            #{t.name}
                        </span>
                    ))
                ) : (
                    <span className="text-xs text-slate-400">No tags</span>
                )}
            </div>
        </div>
    );
}
