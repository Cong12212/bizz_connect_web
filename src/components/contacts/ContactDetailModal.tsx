'use client';

import type { Contact } from "../../services/contacts";
import ContactDetail from "./ContactDetail";
import { ArrowLeft } from "lucide-react";

type Props = {
    open: boolean;
    contact: Contact | null;
    loading?: boolean;
    onClose: () => void;
    onEdit: () => void;
    onUpdated: (c: Contact) => void;
};

export default function ContactDetailModal({ open, contact, loading, onClose, onEdit, onUpdated }: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 bottom-0 top-12 rounded-t-2xl bg-white shadow-xl">
                <div className="flex items-center gap-3 border-b bg-slate-50 p-4">
                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                    <div className="text-base font-semibold">Contact Details</div>
                </div>

                <div className="h-[calc(100%-48px)] overflow-y-auto p-4">
                    {loading ? ( // ✅ Hiển thị loading
                        <div className="grid h-full place-items-center text-slate-500">
                            <div className="text-center">
                                <div className="mb-2 text-2xl">⏳</div>
                                <div>Loading...</div>
                            </div>
                        </div>
                    ) : contact ? (
                        <ContactDetail contact={contact} onEdit={onEdit} onUpdated={onUpdated} />
                    ) : (
                        <div className="grid h-full place-items-center text-slate-500">
                            Contact not found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
