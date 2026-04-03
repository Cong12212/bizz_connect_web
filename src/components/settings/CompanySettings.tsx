import React, { useEffect, useState } from "react";
import { getCompany, saveCompany, deleteCompany, type Company, type CompanyFormData } from "@/services/company";
import { TrashIcon } from "@heroicons/react/24/outline";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";
import CitySelect from "./CitySelect";
import { useToast } from "@/components/ui/Toast";

export default function CompanySettings() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState<CompanyFormData>({
        name: "",
        tax_code: "",
        phone: "",
        email: "",
        website: "",
        description: "",
        address_detail: "",
        country: "",
        state: "",
        city: "",
    });

    useEffect(() => { loadCompany(); }, []);

    async function loadCompany() {
        try {
            setLoading(true);
            const data = await getCompany();
            setCompany(data);
            if (data) {
                setFormData({
                    name: data.name,
                    tax_code: data.tax_code || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    website: data.website || "",
                    description: data.description || "",
                    address_detail: data.address?.address_detail || "",
                    country: data.address?.country?.code || "",
                    state: data.address?.state?.code || "",
                    city: data.address?.city?.code || "",
                });
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setSaving(true);
            const saved = await saveCompany(formData);
            setCompany(saved);
            toast.success("Company saved!");
        } catch (e: any) {
            toast.error(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Delete your company?")) return;
        try {
            await deleteCompany();
            setCompany(null);
            setFormData({
                name: "",
                tax_code: "",
                phone: "",
                email: "",
                website: "",
                description: "",
                address_detail: "",
                country: "",
                state: "",
                city: "",
            });
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete");
        }
    }

    if (loading) return <div className="h-48 animate-pulse rounded-xl border bg-slate-100" />;

    return (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b bg-gradient-to-r from-slate-50 to-white px-5 py-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">Company Details</h3>
                    {company && <p className="text-xs text-slate-500">Last updated {new Date(company.updated_at).toLocaleDateString()}</p>}
                </div>
                {company && (
                    <button onClick={handleDelete} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                        <TrashIcon className="h-4 w-4" />
                        Delete
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Company Name *</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Tax code</label>
                        <input
                            value={formData.tax_code || ""}
                            onChange={(e) => setFormData({ ...formData, tax_code: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Website</label>
                        <input
                            value={formData.website || ""}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                            placeholder="https://example.com"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Phone</label>
                        <input
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-md border px-3 py-2"
                        rows={3}
                    />
                </div>

                {/* Address */}
                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Business Address</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Address detail</label>
                            <input
                                value={formData.address_detail || ""}
                                onChange={(e) => setFormData({ ...formData, address_detail: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                                placeholder="123 Main St"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="mb-1 block textsm font-medium">Country</label>
                                <CountrySelect
                                    value={formData.country || ""}
                                    onChange={(value) => setFormData({ ...formData, country: value, state: "", city: "" })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block textsm font-medium">Province/State</label>
                                <StateSelect
                                    country={formData.country || ""}
                                    value={formData.state || ""}
                                    onChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block textsm font-medium">City/District</label>
                                <CitySelect
                                    state={formData.state || ""}
                                    value={formData.city || ""}
                                    onChange={(value) => setFormData({ ...formData, city: value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : company ? "Update Company" : "Create Company"}
                    </button>
                </div>
            </form>
        </div>
    );
}
