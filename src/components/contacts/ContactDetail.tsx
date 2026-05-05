import React, { useRef, useState } from "react";
import type { Contact } from "../../services/contacts";
import {
    uploadContactAvatar,
    deleteContactAvatar,
    uploadContactCardImage,
    deleteContactCardImage,
} from "../../services/contacts";
import { useToast } from "../ui/Toast";
import { ArrowUpTrayIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import ImageLightbox from "../ui/ImageLightbox";

export default function ContactDetail({
    contact, onEdit, onUpdated, token,
}: {
    contact: Contact;
    onEdit: () => void;
    onUpdated: (c: Contact) => void;
    token?: string;
}) {
    const toast = useToast();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarBusy, setAvatarBusy] = useState(false);
    const [cardBusy, setCardBusy] = useState<{ front: boolean; back: boolean }>({ front: false, back: false });
    const frontInputRef = useRef<HTMLInputElement>(null);
    const backInputRef  = useRef<HTMLInputElement>(null);
    const [lightbox, setLightbox] = useState<{ src: string; name?: string } | null>(null);

    // ── Avatar handlers ──────────────────────────────────────────────────────

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarBusy(true);
        try {
            const { avatar_url } = await uploadContactAvatar(contact.id, file, token);
            onUpdated({ ...contact, avatar_url, updated_at: new Date().toISOString() });
            toast.success("Avatar updated");
        } catch {
            toast.error("Failed to upload avatar");
        } finally {
            setAvatarBusy(false);
            e.target.value = "";
        }
    }

    async function handleAvatarDelete() {
        setAvatarBusy(true);
        try {
            await deleteContactAvatar(contact.id, token);
            onUpdated({ ...contact, avatar: null, avatar_url: null });
            toast.success("Avatar removed");
        } catch {
            toast.error("Failed to remove avatar");
        } finally {
            setAvatarBusy(false);
        }
    }

    // ── Card image handlers ───────────────────────────────────────────────────

    async function handleCardChange(side: "front" | "back", e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setCardBusy((b) => ({ ...b, [side]: true }));
        try {
            const { card_url } = await uploadContactCardImage(contact.id, side, file, token);
            onUpdated({
                ...contact,
                card_front_url: side === "front" ? card_url : contact.card_front_url,
                card_back_url:  side === "back"  ? card_url : contact.card_back_url,
                updated_at: new Date().toISOString(),
            });
            toast.success(`Card ${side} updated`);
        } catch {
            toast.error(`Failed to upload card ${side}`);
        } finally {
            setCardBusy((b) => ({ ...b, [side]: false }));
            e.target.value = "";
        }
    }

    async function handleCardDelete(side: "front" | "back") {
        setCardBusy((b) => ({ ...b, [side]: true }));
        try {
            await deleteContactCardImage(contact.id, side, token);
            onUpdated({
                ...contact,
                card_front_url: side === "front" ? null : contact.card_front_url,
                card_back_url:  side === "back"  ? null : contact.card_back_url,
            });
            toast.success(`Card ${side} removed`);
        } catch {
            toast.error(`Failed to remove card ${side}`);
        } finally {
            setCardBusy((b) => ({ ...b, [side]: false }));
        }
    }

    // ── Fields ────────────────────────────────────────────────────────────────

    const formatAddress = (c: Contact) => {
        if (!c.address) return null;
        if (c.address.full_address) return c.address.full_address;
        const parts = [
            c.address.address_detail,
            c.address.city?.name,
            c.address.state?.name,
            c.address.country?.name,
        ].filter(Boolean);
        return parts.length ? parts.join(", ") : null;
    };

    const fields: Array<{ key: keyof Contact | "formatted_address"; label: string; render?: (v: any) => React.ReactNode }> = [
        { key: "job_title", label: "Job Title" },
        { key: "company",   label: "Company" },
        { key: "email",     label: "Email",    render: (v) => v ? <a className="underline" href={`mailto:${v}`}>{v}</a> : null },
        { key: "phone",     label: "Phone",    render: (v) => v ? <a className="underline" href={`tel:${v}`}>{v}</a> : null },
        { key: "formatted_address", label: "Address", render: () => formatAddress(contact) },
        { key: "notes",       label: "Notes" },
        { key: "linkedin_url", label: "LinkedIn", render: (v) => v ? <a className="underline" target="_blank" href={v}>{v}</a> : null },
        { key: "website_url",  label: "Website",  render: (v) => v ? <a className="underline" target="_blank" href={v}>{v}</a> : null },
    ];

    const shown   = fields.filter((f) => f.key === "formatted_address" ? !!formatAddress(contact) : !!(contact as any)[f.key]);
    const missing = fields.filter((f) => f.key === "formatted_address" ? !formatAddress(contact)  : !(contact as any)[f.key]);

    return (
        <div className="mx-auto max-w-2xl px-4 md:px-0">
            {/* ── Header ── */}
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                    {/* Avatar — click to upload */}
                    <div className="group relative flex-shrink-0">
                        <div
                            onClick={() => !avatarBusy && avatarInputRef.current?.click()}
                            className="relative grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-full bg-slate-200 text-lg font-semibold"
                        >
                            {contact.avatar_url
                                ? <img src={bustUrl(contact.avatar_url, contact.updated_at) as string} alt={contact.name} className="h-full w-full object-cover" />
                                : <span>{initials(contact.name)}</span>
                            }
                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                {avatarBusy
                                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    : <>
                                        <ArrowUpTrayIcon className="h-4 w-4 text-white" />
                                        {contact.avatar_url && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLightbox({ src: bustUrl(contact.avatar_url, contact.updated_at) as string, name: `${contact.name}-avatar.jpg` }); }}
                                                className="flex items-center justify-center"
                                            >
                                                <EyeIcon className="h-4 w-4 text-white" />
                                            </button>
                                        )}
                                    </>
                                }
                            </div>
                        </div>
                        {/* Delete avatar button */}
                        {contact.avatar_url && !avatarBusy && (
                            <button
                                onClick={handleAvatarDelete}
                                className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white group-hover:flex"
                            >
                                <TrashIcon className="h-3 w-3" />
                            </button>
                        )}
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xl font-semibold md:text-2xl">{contact.name}</div>
                        {(contact.company || contact.job_title) && (
                            <div className="truncate text-sm text-slate-500">
                                {[contact.job_title, contact.company].filter(Boolean).join(" · ")}
                            </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {(contact.tags || []).length
                                ? contact.tags!.map(t => (
                                    <span key={t.id} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200">
                                        #{t.name}
                                    </span>
                                ))
                                : <span className="text-xs text-slate-400">No tags</span>
                            }
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <button onClick={onEdit} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 md:w-auto">
                        Edit
                    </button>
                </div>
            </header>

            {/* ── Fields ── */}
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

            {/* ── Business Card Images ── */}
            <div className="mt-6">
                <div className="mb-3 text-sm font-medium text-slate-700">Business Card</div>
                <div className="grid grid-cols-2 gap-3">
                    <CardImageBox
                        label="Front"
                        url={bustUrl(contact.card_front_url, contact.updated_at) ?? null}
                        busy={cardBusy.front}
                        inputRef={frontInputRef}
                        onUpload={(e) => handleCardChange("front", e)}
                        onDelete={() => handleCardDelete("front")}
                        onZoom={(src) => setLightbox({ src, name: `${contact.name}-card-front.jpg` })}
                    />
                    <CardImageBox
                        label="Back"
                        url={bustUrl(contact.card_back_url, contact.updated_at) ?? null}
                        busy={cardBusy.back}
                        inputRef={backInputRef}
                        onUpload={(e) => handleCardChange("back", e)}
                        onDelete={() => handleCardDelete("back")}
                        onZoom={(src) => setLightbox({ src, name: `${contact.name}-card-back.jpg` })}
                    />
                </div>
            </div>

            {lightbox && (
                <ImageLightbox
                    src={lightbox.src}
                    downloadName={lightbox.name}
                    onClose={() => setLightbox(null)}
                />
            )}

            {/* ── Missing fields ── */}
            {missing.length ? (
                <div className="mt-6 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
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

// ── Card Image Box ─────────────────────────────────────────────────────────────

function CardImageBox({ label, url, busy, inputRef, onUpload, onDelete, onZoom }: {
    label: string;
    url: string | null;
    busy: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete: () => void;
    onZoom?: (src: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="group relative aspect-[1.586] overflow-hidden rounded-xl border bg-slate-50">
                {url ? (
                    <>
                        <img
                            src={url}
                            alt={`Card ${label}`}
                            className="h-full w-full cursor-zoom-in object-cover"
                            onClick={() => onZoom?.(url)}
                        />
                        {/* Hover actions — always visible on touch devices */}
                        {!busy && (
                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                                <button
                                    onClick={() => onZoom?.(url)}
                                    className="flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-white"
                                >
                                    <EyeIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">View</span>
                                </button>
                                <button
                                    onClick={() => inputRef.current?.click()}
                                    className="flex items-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:bg-white"
                                >
                                    <ArrowUpTrayIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Replace</span>
                                </button>
                                <button
                                    onClick={onDelete}
                                    className="flex items-center gap-1 rounded-lg bg-rose-500/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-600"
                                >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button
                        onClick={() => !busy && inputRef.current?.click()}
                        disabled={busy}
                        className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500 disabled:opacity-50"
                    >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        <span className="text-xs">Upload {label}</span>
                    </button>
                )}
                {busy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function bustUrl(url: string | null | undefined, updatedAt?: string): string | null | undefined {
    if (!url) return url;
    const ts = updatedAt ? new Date(updatedAt).getTime() : 0;
    if (!ts) return url;
    return `${url.split('?')[0]}?t=${ts}`;
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
    return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}
