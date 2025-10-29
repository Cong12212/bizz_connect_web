import React, { useEffect, useState } from "react";
import { getBusinessCard, saveBusinessCard, deleteBusinessCard, type BusinessCard, type BusinessCardFormData } from "@/services/businessCard";
import { getCompany, type Company } from "@/services/company";
import { TrashIcon, LinkIcon, EyeIcon, ShareIcon } from "@heroicons/react/24/outline";

export default function BusinessCardSettings() {
    const [card, setCard] = useState<BusinessCard | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [formData, setFormData] = useState<BusinessCardFormData>({
        full_name: "",
        email: "",
        job_title: "",
        phone: "",
        mobile: "",
        website: "",
        linkedin: "",
        notes: "",
        is_public: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [cardData, companyData] = await Promise.all([getBusinessCard(), getCompany()]);
            setCard(cardData);
            setCompany(companyData);
            if (cardData) {
                setFormData({
                    full_name: cardData.full_name,
                    email: cardData.email,
                    job_title: cardData.job_title || "",
                    phone: cardData.phone || "",
                    mobile: cardData.mobile || "",
                    website: cardData.website || "",
                    linkedin: cardData.linkedin || "",
                    notes: cardData.notes || "",
                    is_public: cardData.is_public ?? true,
                });
            }
        } catch (e: any) {
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            const payload: any = {
                ...formData,
                company_id: company?.id,
                is_public: Boolean(formData.is_public)
            };
            const saved = await saveBusinessCard(payload);
            setCard(saved);
            alert("Business card saved!");
        } catch (e: any) {
            alert(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete your business card?")) return;
        try {
            await deleteBusinessCard();
            setCard(null);
            setFormData({
                full_name: "",
                email: "",
                job_title: "",
                phone: "",
                mobile: "",
                website: "",
                linkedin: "",
                notes: "",
                is_public: true,
            });
        } catch (e: any) {
            alert(e?.message || "Failed to delete");
        }
    }

    function copyShareLink() {
        if (!card?.slug) return;
        const link = `${window.location.origin}/card/${card.slug}`;
        navigator.clipboard.writeText(link);
        alert("Link copied to clipboard!");
    }

    if (loading) {
        return <div className="h-48 animate-pulse rounded-xl border bg-slate-100" />;
    }

    const publicUrl = card?.slug ? `${window.location.origin}/card/${card.slug}` : null;

    return (
        <>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Card Details</h3>
                        {card && <p className="text-xs text-slate-500">Last updated {new Date(card.updated_at).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {card && publicUrl && (
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
                            >
                                <ShareIcon className="h-4 w-4" />
                                Share
                            </button>
                        )}
                        {card && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Public Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Make card public</p>
                            <p className="text-xs text-slate-600">Allow others to view and connect with you</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                            <input
                                type="checkbox"
                                checked={formData.is_public}
                                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                        </label>
                    </div>

                    {/* Card Stats */}
                    {card && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-white p-3">
                                <div className="flex items-center gap-2">
                                    <EyeIcon className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-xs text-slate-600">Views</p>
                                        <p className="text-lg font-semibold text-slate-900">{card.view_count || 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-lg border bg-gradient-to-br from-green-50 to-white p-3">
                                <div className="flex items-center gap-2">
                                    <LinkIcon className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-xs text-slate-600">Status</p>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {card.is_public ? "Public" : "Private"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Full Name *</label>
                            <input
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Job Title</label>
                            <input
                                value={formData.job_title}
                                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Phone</label>
                            <input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Mobile</label>
                            <input
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">LinkedIn</label>
                            <input
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                            />
                        </div>
                    </div>
                    {company && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                            <p className="text-xs font-medium text-blue-900">
                                <span className="text-blue-600">Company: </span>
                                {company.name}
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end border-t pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {saving ? "Saving..." : card ? "Update Card" : "Create Card"}
                        </button>
                    </div>
                </form>
            </div>

            {/* Share Modal */}
            {showShareModal && publicUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowShareModal(false)}>
                    <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="mb-4 text-lg font-semibold">Share Your Business Card</h3>
                        <p className="mb-4 text-sm text-slate-600">Share this link with others to connect</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={publicUrl}
                                readOnly
                                className="flex-1 rounded-md border bg-slate-50 px-3 py-2 text-sm"
                            />
                            <button
                                onClick={copyShareLink}
                                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => setShowShareModal(false)}
                                className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
