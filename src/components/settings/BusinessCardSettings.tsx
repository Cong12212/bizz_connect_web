import React, { useEffect, useRef, useState } from "react";
import CardGenerator from "./CardGenerator";
import {
    getBusinessCard,
    saveBusinessCard,
    deleteBusinessCard,
    extractBusinessCardInfo,
    type BusinessCard,
    type BusinessCardFormData,
    type ExtractedCardInfo,
} from "@/services/businessCard";
import { ocrImage } from "@/lib/ocr";
import { getCompany, type Company } from "@/services/company";
import {
    TrashIcon, LinkIcon, EyeIcon, ShareIcon,
    ArrowUpTrayIcon, XMarkIcon, CreditCardIcon,
} from "@heroicons/react/24/outline";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";
import CitySelect from "./CitySelect";
import { useToast } from "@/components/ui/Toast";

const EMPTY_FORM: BusinessCardFormData = {
    full_name: "",
    email: "",
    job_title: "",
    phone: "",
    mobile: "",
    website: "",
    linkedin: "",
    notes: "",
    is_public: true,
    address_detail: "",
    country: "",
    state: "",
    city: "",
};

function initForm(card: BusinessCard | null): BusinessCardFormData {
    if (!card) return EMPTY_FORM;
    return {
        ...EMPTY_FORM,
        full_name: card.full_name || "",
        email: card.email || "",
        job_title: card.job_title || "",
        phone: card.phone || "",
        mobile: card.mobile || "",
        website: card.website || "",
        linkedin: card.linkedin || "",
        notes: card.notes || "",
        is_public: card.is_public ?? true,
        address_detail: (card.address as any)?.address_detail || "",
        country: (card.address as any)?.country?.code || "",
        state: (card.address as any)?.state?.code || "",
        city: (card.address as any)?.city?.code || "",
    };
}

export default function BusinessCardSettings() {
    const toast = useToast();
    const [card, setCard] = useState<BusinessCard | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [cardData, companyData] = await Promise.all([getBusinessCard(), getCompany()]);
            setCard(cardData);
            setCompany(companyData);
        } catch (e) {
            console.error("Load business card error:", e);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete your business card?")) return;
        try {
            await deleteBusinessCard();
            setCard(null);
            toast.success("Business card deleted");
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete");
        }
    }

    function copyShareLink() {
        if (!card?.slug) return;
        navigator.clipboard.writeText(`${window.location.origin}/card/${card.slug}`);
        toast.success("Link copied to clipboard!");
    }

    if (loading) return <div className="h-48 animate-pulse rounded-xl border bg-slate-100" />;

    const publicUrl = card?.slug ? `${window.location.origin}/card/${card.slug}` : null;

    return (
        <>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-linear-to-r from-slate-50 to-white px-5 py-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Business Card</h3>
                        {card && <p className="text-xs text-slate-500">Last updated {new Date(card.updated_at).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {card && publicUrl && (
                            <button onClick={() => setShowShareModal(true)} className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100">
                                <ShareIcon className="h-4 w-4" /> Share
                            </button>
                        )}
                        {card && (
                            <button onClick={() => setShowDialog(true)} className="flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200">
                                Edit
                            </button>
                        )}
                        {card && (
                            <button onClick={handleDelete} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                                <TrashIcon className="h-4 w-4" /> Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Preview or empty */}
                {card ? (
                    <div className="px-5 pb-5 pt-4 space-y-5">
                        {/* Cards side by side */}
                        <CardGenerator card={card} company={company} sideBySide />

                        {/* Info below */}
                        <div className="grid grid-cols-1 gap-3 rounded-xl border bg-slate-50 p-4 sm:grid-cols-2">
                            {[
                                { label: "Name",     value: card.full_name },
                                { label: "Job Title", value: card.job_title },
                                { label: "Email",    value: card.email },
                                { label: "Phone",    value: card.phone },
                                { label: "Mobile",   value: card.mobile },
                                { label: "Website",  value: card.website },
                                { label: "LinkedIn", value: card.linkedin },
                            ].filter(f => f.value).map(f => (
                                <div key={f.label} className="min-w-0">
                                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{f.label}</div>
                                    <div className="truncate text-sm text-slate-800">{f.value}</div>
                                </div>
                            ))}
                            {(card.address as any)?.full_address && (
                                <div className="sm:col-span-2 min-w-0">
                                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Address</div>
                                    <div className="text-sm text-slate-800">{(card.address as any).full_address}</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-5 p-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <CreditCardIcon className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">No business card yet</p>
                            <p className="mt-1 text-sm text-slate-500">Upload your physical card or create a digital one</p>
                        </div>
                        <button onClick={() => setShowDialog(true)} className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                            Create Business Card
                        </button>
                    </div>
                )}

                {/* Stats */}
                {card && (
                    <div className="border-t bg-slate-50 px-5 py-3">
                        <div className="flex items-center gap-6 text-sm text-slate-600">
                            <div className="flex items-center gap-1.5"><EyeIcon className="h-4 w-4" />{card.view_count || 0} views</div>
                            <div className="flex items-center gap-1.5"><LinkIcon className="h-4 w-4" />{card.is_public ? "Public" : "Private"}</div>
                        </div>
                    </div>
                )}
            </div>

            {showDialog && (
                <CardDialog
                    card={card}
                    company={company}
                    onClose={() => setShowDialog(false)}
                    onSaved={(saved) => { setCard(saved); setShowDialog(false); }}
                />
            )}

            {showShareModal && publicUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShareModal(false)}>
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-4 text-lg font-semibold">Share Your Business Card</h3>
                        <div className="flex gap-2">
                            <input type="text" value={publicUrl} readOnly className="flex-1 rounded-md border bg-slate-50 px-3 py-2 text-sm" />
                            <button onClick={copyShareLink} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Copy</button>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowShareModal(false)} className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ─── Card Preview ─── */
function CardPreview({ card }: { card: BusinessCard }) {
    const hasPhysical = !!(card.card_image_front || card.card_image_back);
    const cardFace = card.background_image ?? undefined;

    return (
        <div className="p-5">
            <div className="overflow-hidden rounded-xl border shadow-sm">
                {hasPhysical ? (
                    <div className="bg-linear-to-b from-slate-200 to-slate-300 px-5 py-6 space-y-5">
                        {card.card_image_front && <MiniCardSlot src={card.card_image_front} label="Front" />}
                        {card.card_image_back && <MiniCardSlot src={card.card_image_back} label="Back" />}
                    </div>
                ) : cardFace ? (
                    <div className="bg-linear-to-b from-slate-200 to-slate-300 px-5 py-6">
                        <MiniCardSlot src={cardFace} label="Digital Card" />
                    </div>
                ) : (
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-lg font-bold text-white">
                            {card.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{card.full_name}</p>
                            {card.job_title && <p className="text-sm text-slate-500">{card.job_title}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function MiniCardSlot({ src, label }: { src: string; label: string }) {
    return (
        <div className="relative mx-auto w-full">
            <div className="absolute inset-0 translate-y-1.5 scale-[0.97] rounded-xl bg-black/20 blur-sm" />
            <div className="relative overflow-hidden rounded-xl ring-1 ring-black/10" style={{ aspectRatio: "1.586" }}>
                <img src={src} alt={label} className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm backdrop-blur-sm ring-1 ring-slate-200">
                    {label}
                </span>
            </div>
        </div>
    );
}

/* ─── Single Card Dialog ─── */
type CardMode = "physical" | "digital";

function CardDialog({
    card, company, onClose, onSaved,
}: {
    card: BusinessCard | null;
    company: Company | null;
    onClose: () => void;
    onSaved: (c: BusinessCard) => void;
}) {
    const toast = useToast();
    const hasPhysical = !!(card?.card_image_front || card?.card_image_back);
    const [mode, setMode] = useState<CardMode>(hasPhysical ? "physical" : "digital");

    // Physical mode state
    const [frontFile, setFrontFile] = useState<File | null>(null);
    const [backFile, setBackFile] = useState<File | null>(null);
    const [frontPreview, setFrontPreview] = useState(card?.card_image_front || "");
    const [backPreview, setBackPreview] = useState(card?.card_image_back || "");
    const [extracting, setExtracting] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);

    // Digital mode state
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState(card?.background_image || "");

    const [form, setForm] = useState<BusinessCardFormData>(initForm(card));
    const [saving, setSaving] = useState(false);

    async function handleFrontSelect(file: File) {
        setFrontFile(file);
        setFrontPreview(URL.createObjectURL(file));

        setExtracting(true);
        setOcrProgress(0);
        try {
            const rawText = await ocrImage(file, setOcrProgress);
            const info: ExtractedCardInfo = await extractBusinessCardInfo(rawText);
            setForm((prev) => ({
                ...prev,
                full_name: info.full_name || prev.full_name,
                email: info.email || prev.email,
                job_title: info.job_title || prev.job_title,
                phone: info.phone || prev.phone,
                mobile: info.mobile || prev.mobile,
                website: info.website || prev.website,
                linkedin: info.linkedin || prev.linkedin,
                address_detail: info.address_detail || prev.address_detail,
            }));
            toast.success("Card info extracted! Review and adjust below.");
        } catch {
            toast.error("Could not extract info, please fill in manually.");
        } finally {
            setExtracting(false);
            setOcrProgress(0);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: BusinessCardFormData = {
                ...form,
                company_id: company?.id,
                is_public: Boolean(form.is_public),
            };

            if (mode === "physical") {
                if (frontFile) payload.card_image_front = frontFile;
                if (backFile) payload.card_image_back = backFile;
                if (card?.background_image) payload.clear_background = true;
            } else {
                if (bgFile) payload.background_image = bgFile;
                if (card?.card_image_front || card?.card_image_back) payload.clear_card_images = true;
            }

            const saved = await saveBusinessCard(payload);
            toast.success("Business card saved!");
            onSaved(saved);
        } catch (e: any) {
            toast.error(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Dialog header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-slate-900">{card ? "Edit Business Card" : "Create Business Card"}</h2>
                    <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Mode toggle */}
                        <div className="flex rounded-xl border border-slate-200 p-1 gap-1">
                            <button
                                type="button"
                                onClick={() => setMode("physical")}
                                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === "physical" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                📷 Scan Physical Card
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("digital")}
                                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === "digital" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                            >
                                ✨ Create Digital Card
                            </button>
                        </div>

                        {/* Physical mode */}
                        {mode === "physical" && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Upload your physical card — info will be auto-extracted from the front image.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <CardImageUpload
                                        label="Front"
                                        preview={frontPreview}
                                        loading={extracting}
                                        progress={ocrProgress}
                                        onChange={handleFrontSelect}
                                        onRemove={() => { setFrontFile(null); setFrontPreview(""); }}
                                    />
                                    <CardImageUpload
                                        label="Back"
                                        preview={backPreview}
                                        onChange={(f) => { setBackFile(f); setBackPreview(URL.createObjectURL(f)); }}
                                        onRemove={() => { setBackFile(null); setBackPreview(""); }}
                                    />
                                </div>
                                {extracting && (
                                    <div className="space-y-1.5 rounded-lg bg-blue-50 px-4 py-2.5">
                                        <div className="flex items-center gap-2 text-sm text-blue-700">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                                            {ocrProgress < 100 ? `Reading card… ${ocrProgress}%` : "Parsing info…"}
                                        </div>
                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                                            <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Digital mode */}
                        {mode === "digital" && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-slate-700">Card Background Image</p>
                                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 ring-1 ring-amber-200">
                                        16:9 ratio recommended for best result
                                    </span>
                                </div>
                                {bgPreview ? (
                                    <div className="group relative overflow-hidden rounded-xl border" style={{ aspectRatio: "16/9" }}>
                                        <img src={bgPreview} alt="Background" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setBgFile(null); setBgPreview(""); }}
                                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50" style={{ aspectRatio: "16/9" }}>
                                        <ArrowUpTrayIcon className="h-7 w-7" />
                                        <span className="text-sm">Upload background image</span>
                                        <span className="text-xs text-slate-300">PNG, JPG up to 10MB</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) { setBgFile(f); setBgPreview(URL.createObjectURL(f)); }
                                        }} />
                                    </label>
                                )}
                            </div>
                        )}

                        {/* Public toggle */}
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Make card public</p>
                                <p className="text-xs text-slate-500">Allow others to view and connect with you</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" checked={!!form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} className="peer sr-only" />
                                <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full" />
                            </label>
                        </div>

                        <FormFields form={form} setForm={setForm} />

                        <div className="flex justify-end gap-2 border-t pt-4">
                            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                            <button type="submit" disabled={saving || extracting} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">
                                {saving ? "Saving…" : card ? "Update Card" : "Create Card"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

/* ─── Card Image Upload field ─── */
function CardImageUpload({ label, preview, loading, progress, onChange, onRemove }: {
    label: string;
    preview: string;
    loading?: boolean;
    progress?: number;
    onChange: (f: File) => void;
    onRemove: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            {preview ? (
                <div className="group relative overflow-hidden rounded-xl border" style={{ aspectRatio: "16/9" }}>
                    <img src={preview} alt={label} className="h-full w-full object-cover" />
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {(progress ?? 0) > 0 && <span className="text-xs text-white">{progress}%</span>}
                        </div>
                    ) : (
                        <button type="button" onClick={onRemove} className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            ) : (
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    style={{ aspectRatio: "16/9" }}
                >
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    <span className="text-xs">Upload {label.toLowerCase()}</span>
                </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ""; }} />
        </div>
    );
}

/* ─── Shared Form Fields ─── */
function FormFields({ form, setForm }: { form: BusinessCardFormData; setForm: React.Dispatch<React.SetStateAction<BusinessCardFormData>> }) {
    const f = (label: string, key: keyof BusinessCardFormData, type = "text") => (
        <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
            <input type={type} value={(form[key] as string) || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
        </div>
    );
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {f("Full Name *", "full_name")}
                {f("Email *", "email", "email")}
                {f("Job Title", "job_title")}
                {f("Phone", "phone")}
                {f("Mobile", "mobile")}
                {f("LinkedIn", "linkedin")}
                {f("Website", "website")}
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
                <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" rows={2} />
            </div>
            <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">Address</p>
                <input type="text" value={form.address_detail || ""} onChange={(e) => setForm({ ...form, address_detail: e.target.value })}
                    placeholder="123 Main St" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300" />
                <div className="grid grid-cols-3 gap-2">
                    <CountrySelect value={form.country || ""} onChange={(v) => setForm({ ...form, country: v, state: "", city: "" })} />
                    <StateSelect country={form.country || ""} value={form.state || ""} onChange={(v) => setForm({ ...form, state: v, city: "" })} />
                    <CitySelect state={form.state || ""} value={form.city || ""} onChange={(v) => setForm({ ...form, city: v })} />
                </div>
            </div>
        </div>
    );
}
