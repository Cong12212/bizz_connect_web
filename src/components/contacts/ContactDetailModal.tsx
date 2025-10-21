'use client';

import type { Contact } from "../../services/contacts";
import ContactDetail from "./ContactDetail";

type Props = {
    open: boolean;
    contact: Contact | null;
    onClose: () => void;
    onEdit: () => void;
    onUpdated: (c: Contact) => void;
};

export default function ContactDetailModal({ open, contact, onClose, onEdit, onUpdated }: Props) {
    if (!open) return null;

    return (
        // chỉ hiển thị trên mobile
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 bottom-0 top-12 rounded-t-2xl bg-white shadow-xl">
                <div className="flex items-center gap-3 border-b p-3">
                    <button
                        onClick={onClose}
                        className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                    >
                        ← Back
                    </button>
                    <div className="font-semibold">Contact details</div>
                </div>

                <div className="h-[calc(100%-48px)] overflow-y-auto p-4">
                    {contact ? (
                        <ContactDetail contact={contact} onEdit={onEdit} onUpdated={onUpdated} />
                    ) : (
                        <div className="grid h-full place-items-center text-slate-500">Loading…</div>
                    )}
                </div>
            </div>
        </div>
    );
}
