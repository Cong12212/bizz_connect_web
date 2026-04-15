// src/components/contacts/EditContactSheet.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { Contact } from '../../services/contacts';
import {
    createContact, updateContact,
    uploadContactAvatar, uploadContactCardImage, copyContactCardImageFromUrl,
} from '../../services/contacts';
import { Spinner, useToast } from '../ui/Toast';
import CountrySelect from '../settings/CountrySelect';
import StateSelect from '../settings/StateSelect';
import CitySelect from '../settings/CitySelect';
import { ArrowUpTrayIcon, XMarkIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline';

export default function EditContactSheet({
    open, onClose, token, contact, onSaved, onDelete, initialForm,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    contact: Contact | null;
    onSaved: (c: Contact) => void;
    onDelete?: (id: number) => void;
    initialForm?: Partial<Record<string, any>>;
}) {
    const toast = useToast();
    const [form, setForm] = useState<any>({});
    const [saving, setSaving] = useState(false);

    // ── Image upload state ────────────────────────────────────────────────────
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const frontInputRef  = useRef<HTMLInputElement>(null);
    const backInputRef   = useRef<HTMLInputElement>(null);
    const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
    const [pendingFront,  setPendingFront]  = useState<File | null>(null);
    const [pendingBack,   setPendingBack]   = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [frontPreview,  setFrontPreview]  = useState<string | null>(null);
    const [backPreview,   setBackPreview]   = useState<string | null>(null);

    // ── Reset on open / contact change ───────────────────────────────────────
    useEffect(() => {
        if (contact) {
            setForm({
                ...contact,
                address_detail: contact.address?.address_detail || "",
                city: contact.address?.city?.code || "",
                state: contact.address?.state?.code || "",
                country: contact.address?.country?.code || "",
            });
            setAvatarPreview(contact.avatar_url ?? null);
            setFrontPreview(contact.card_front_url ?? null);
            setBackPreview(contact.card_back_url ?? null);
        } else {
            setForm({
                ...(initialForm || {}),
                address_detail: initialForm?.address_detail ?? "",
                country: initialForm?.country ?? "",
                state:   initialForm?.state ?? "",
                city:    initialForm?.city ?? "",
            });
            setAvatarPreview(null);
            setFrontPreview(initialForm?._card_front_url ?? null);
            setBackPreview(initialForm?._card_back_url ?? null);
        }
        setPendingAvatar(null);
        setPendingFront(null);
        setPendingBack(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contact?.id, open]);

    const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

    // ── Image pickers ─────────────────────────────────────────────────────────
    function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
        setPendingAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
        e.target.value = '';
    }
    function pickFront(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (frontPreview?.startsWith('blob:')) URL.revokeObjectURL(frontPreview);
        setPendingFront(file);
        setFrontPreview(URL.createObjectURL(file));
        e.target.value = '';
    }
    function pickBack(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (backPreview?.startsWith('blob:')) URL.revokeObjectURL(backPreview);
        setPendingBack(file);
        setBackPreview(URL.createObjectURL(file));
        e.target.value = '';
    }

    // ── URL validation ────────────────────────────────────────────────────────
    function okURL(v?: string | null) {
        if (!v) return true;
        try { new URL(v); return true; } catch { return false; }
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const save = async () => {
        const payload = {
            name:         form.name?.trim() || '(No name)',
            job_title:    form.job_title    || null,
            company:      form.company      || null,
            email:        form.email        || null,
            phone:        form.phone        || null,
            address_detail: form.address_detail || null,
            city:         form.city         || null,
            state:        form.state        || null,
            country:      form.country      || null,
            notes:        form.notes        || null,
            linkedin_url: form.linkedin_url || null,
            website_url:  form.website_url  || null,
            source:       form.source       || undefined,
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
            let saved = contact?.id
                ? await updateContact(contact.id, payload, token)
                : await createContact(payload, token);

            // Upload pending image files
            if (pendingAvatar) {
                const r = await uploadContactAvatar(saved.id, pendingAvatar, token);
                saved = { ...saved, avatar_url: r.avatar_url };
            }
            if (pendingFront) {
                const r = await uploadContactCardImage(saved.id, 'front', pendingFront, token);
                saved = { ...saved, card_front_url: r.card_url };
            }
            if (pendingBack) {
                const r = await uploadContactCardImage(saved.id, 'back', pendingBack, token);
                saved = { ...saved, card_back_url: r.card_url };
            }

            // Copy card images from business card (new contact only)
            if (!contact?.id) {
                for (const side of ['front', 'back'] as const) {
                    const src = side === 'front' ? initialForm?._card_front_url : initialForm?._card_back_url;
                    const hasPending = side === 'front' ? !!pendingFront : !!pendingBack;
                    if (!src || hasPending) continue;
                    try {
                        let r: { card_url: string };
                        if (src.startsWith('data:')) {
                            const file = dataUrlToFile(src, `card_${side}.jpg`);
                            r = await uploadContactCardImage(saved.id, side, file, token);
                        } else {
                            r = await copyContactCardImageFromUrl(saved.id, side, src, token);
                        }
                        saved = side === 'front'
                            ? { ...saved, card_front_url: r.card_url }
                            : { ...saved, card_back_url:  r.card_url };
                    } catch {}
                }
            }

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
                    <button onClick={onClose} className="rounded-full p-2 text-slate-600 hover:bg-slate-100" disabled={saving} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Source badge */}
                {form.source === 'business_card' && (
                    <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-900">
                            📇 <span className="font-medium">Imported from Business Card</span>
                        </p>
                    </div>
                )}

                {/* ── Images ── */}
                <div className="mb-5 flex items-start gap-3">
                    {/* Avatar */}
                    <div className="group relative flex-shrink-0">
                        <div
                            onClick={() => !saving && avatarInputRef.current?.click()}
                            className="relative grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-full bg-slate-200 text-lg font-semibold"
                        >
                            {avatarPreview
                                ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                                : <span className="text-slate-600">{initials(form.name)}</span>
                            }
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <ArrowUpTrayIcon className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
                    </div>

                    {/* Card front + back */}
                    <div className="flex flex-1 gap-2">
                        <MiniCardBox
                            label="Card Front"
                            preview={frontPreview}
                            inputRef={frontInputRef}
                            onPick={pickFront}
                            onDelete={() => { setFrontPreview(null); setPendingFront(null); if (frontInputRef.current) frontInputRef.current.value = ''; }}
                            disabled={saving}
                        />
                        <MiniCardBox
                            label="Card Back"
                            preview={backPreview}
                            inputRef={backInputRef}
                            onPick={pickBack}
                            onDelete={() => { setBackPreview(null); setPendingBack(null); if (backInputRef.current) backInputRef.current.value = ''; }}
                            disabled={saving}
                        />
                    </div>
                </div>

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
                                placeholder="123 Main St, Suite 4"
                                disabled={saving}
                            />
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Country</label>
                                    <CountrySelect value={form.country ?? ''} onChange={(v) => { set('country', v); set('state', ''); set('city', ''); }} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">Province/State</label>
                                    <StateSelect country={form.country ?? ''} value={form.state ?? ''} onChange={(v) => { set('state', v); set('city', ''); }} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm text-slate-600">City/District</label>
                                    <CitySelect state={form.state ?? ''} value={form.city ?? ''} onChange={(v) => set('city', v)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <TextArea label="Notes" value={form.notes || ''} onChange={(v) => set('notes', v)} disabled={saving} />

                    <div className="mt-2 text-sm font-medium">Links</div>
                    <Input label="LinkedIn" placeholder="https://linkedin.com/in/..." value={form.linkedin_url || ''} onChange={(v) => set('linkedin_url', v)} disabled={saving} />
                    <Input label="Website"  placeholder="https://example.com"          value={form.website_url  || ''} onChange={(v) => set('website_url',  v)} disabled={saving} />
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                    <div>
                        {contact?.id && onDelete && (
                            <button onClick={() => onDelete(contact.id)} disabled={saving} className="rounded-xl px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60">
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="rounded-xl px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60" disabled={saving}>
                            Cancel
                        </button>
                        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60">
                            {saving && <Spinner />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Mini card image box ────────────────────────────────────────────────────────

function MiniCardBox({ label, preview, inputRef, onPick, onDelete, disabled }: {
    label: string;
    preview: string | null;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    disabled?: boolean;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (window.confirm(`Bạn có chắc muốn xoá ảnh "${label}" không?`)) {
            onDelete();
        }
    }

    function handleReplace(e: React.MouseEvent) {
        e.stopPropagation();
        if (!disabled) inputRef.current?.click();
    }

    return (
        <>
            <div className="group flex-1 space-y-1">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="relative aspect-[1.586] overflow-hidden rounded-lg border bg-slate-50">
                    {preview ? (
                        <>
                            {/* Click image → open lightbox */}
                            <img
                                src={preview}
                                alt={label}
                                className="h-full w-full cursor-zoom-in object-cover"
                                onClick={() => setLightboxOpen(true)}
                            />
                            {/* Hover overlay: replace button */}
                            <div className="absolute inset-0 flex items-end justify-end p-1 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                                <button
                                    type="button"
                                    onClick={handleReplace}
                                    disabled={disabled}
                                    className="pointer-events-auto rounded bg-black/60 p-1 text-white hover:bg-black/80"
                                    title="Thay ảnh mới"
                                >
                                    <ArrowUpTrayIcon className="h-3 w-3" />
                                </button>
                            </div>
                            {/* Delete "x" button — always visible top-right */}
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={disabled}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-rose-600 disabled:opacity-40"
                                title="Xoá ảnh"
                            >
                                <XMarkIcon className="h-3 w-3" />
                            </button>
                        </>
                    ) : (
                        <div
                            onClick={() => !disabled && inputRef.current?.click()}
                            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-slate-300"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                            <span className="text-[10px]">Upload</span>
                        </div>
                    )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
            </div>

            {/* Lightbox */}
            {lightboxOpen && preview && (
                <div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setLightboxOpen(false)}
                >
                    <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <img src={preview} alt={label} className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="absolute -right-3 -top-3 rounded-full bg-white p-1 shadow-md hover:bg-slate-100"
                            title="Đóng"
                        >
                            <XMarkIcon className="h-5 w-5 text-slate-700" />
                        </button>
                        <div className="mt-2 text-center text-sm text-white/80">{label}</div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dataUrlToFile(dataUrl: string, filename: string): File {
    const [header, b64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)![1];
    const binary = atob(b64);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new File([arr], filename, { type: mime });
}

function initials(name?: string) {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function Input({
    label, value, onChange, type = 'text', required = false, placeholder, disabled = false,
}: {
    label: string; value: string; onChange: (v: string) => void;
    type?: string; required?: boolean; placeholder?: string; disabled?: boolean;
}) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">{label}{required && <span className="text-rose-600"> *</span>}</div>
            <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} disabled={disabled}
                className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100" />
        </label>
    );
}

function TextArea({ label, value, onChange, disabled = false }: {
    label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
    return (
        <label className="block text-sm">
            <div className="mb-1 text-slate-600">{label}</div>
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} disabled={disabled}
                className="w-full resize-y rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100" />
        </label>
    );
}
