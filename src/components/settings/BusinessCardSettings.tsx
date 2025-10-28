import React, { useEffect, useState } from "react";
import { getBusinessCard, saveBusinessCard, deleteBusinessCard, type BusinessCard, type BusinessCardFormData } from "@/services/businessCard";
import { getCompany, type Company } from "@/services/company";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function BusinessCardSettings() {
    const [card, setCard] = useState<BusinessCard | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<BusinessCardFormData>({
        full_name: "",
        email: "",
        job_title: "",
        phone: "",
        mobile: "",
        website: "",
        linkedin: "",
        notes: "",
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
            const payload = { ...formData, company_id: company?.id };
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
            });
        } catch (e: any) {
            alert(e?.message || "Failed to delete");
        }
    }

    if (loading) {
        return <div className="h-48 animate-pulse rounded-xl border bg-slate-100" />;
    }

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Card Details</h3>
                    {card && <p className="text-xs text-slate-500">Last updated {new Date(card.updated_at).toLocaleDateString()}</p>}
                </div>
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

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
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
    );
}
