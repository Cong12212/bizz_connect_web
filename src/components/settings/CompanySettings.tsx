import React, { useEffect, useState } from "react";
import { getCompany, saveCompany, deleteCompany, type Company, type CompanyFormData } from "@/services/company";
import { TrashIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import CountrySelect from "./CountrySelect";
import StateSelect from "./StateSelect";
import CitySelect from "./CitySelect";

export default function CompanySettings() {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CompanyFormData>({
        name: "",
        domain: "",
        industry: "",
        description: "",
        website: "",
        email: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        country: "",
    });

    useEffect(() => {
        loadCompany();
    }, []);

    async function loadCompany() {
        try {
            setLoading(true);
            const data = await getCompany();
            setCompany(data);
            if (data) {
                setFormData({
                    name: data.name,
                    domain: data.domain || "",
                    industry: data.industry || "",
                    description: data.description || "",
                    website: data.website || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    address_line1: data.address_line1 || "",
                    address_line2: data.address_line2 || "",
                    city: data.city || "",
                    state: data.state || "",
                    country: data.country || "",
                });
            }
        } catch (e: any) {
            setError(e?.message || "Failed to load company");
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
            alert("Company saved!");
        } catch (e: any) {
            alert(e?.message || "Failed to save");
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
                domain: "",
                industry: "",
                description: "",
                website: "",
                email: "",
                phone: "",
                address_line1: "",
                address_line2: "",
                city: "",
                state: "",
                country: "",
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
                    <h3 className="text-sm font-semibold text-slate-900">Company Details</h3>
                    {company && <p className="text-xs text-slate-500">Last updated {new Date(company.updated_at).toLocaleDateString()}</p>}
                </div>
                {company && (
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
                        <label className="mb-1 block text-sm font-medium">Company Name *</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Domain</label>
                        <input
                            value={formData.domain}
                            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                            placeholder="example.com"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Industry</label>
                        <input
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Website</label>
                        <input
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            className="w-full rounded-md border px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full rounded-md border px-3 py-2"
                        rows={3}
                    />
                </div>

                {/* Address Section */}
                <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Business Address</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Street Address</label>
                            <input
                                value={formData.address_line1}
                                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                                placeholder="123 Nguyễn Huệ"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Apartment, Suite, Floor (Optional)</label>
                            <input
                                value={formData.address_line2}
                                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                                className="w-full rounded-md border px-3 py-2"
                                placeholder="Tầng 5, Phòng 501"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Country</label>
                                <CountrySelect
                                    value={formData.country}
                                    onChange={(value) => setFormData({ ...formData, country: value, state: "", city: "" })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Province/State</label>
                                <StateSelect
                                    country={formData.country}
                                    value={formData.state}
                                    onChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">City/District</label>
                                <CitySelect
                                    state={formData.state}
                                    value={formData.city}
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
