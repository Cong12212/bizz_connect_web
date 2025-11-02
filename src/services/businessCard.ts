import { data } from "react-router-dom";
import api from "./api";
import type { Address } from "./company";

export interface BusinessCard {
    id: number;
    user_id: number;
    company_id?: number | null;
    slug?: string | null;
    full_name: string;
    job_title?: string | null;
    department?: string | null;
    email: string;
    phone?: string | null;
    mobile?: string | null;
    website?: string | null;
    linkedin?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    avatar?: string | null;
    notes?: string | null;
    is_public?: boolean;
    view_count?: number;
    created_at: string;
    updated_at: string;
    address_id?: number | null;
    address?: Address | null;
    company?: {
        id: number;
        name: string;
        website?: string | null;
        logo?: string | null;
    } | null;
}

export interface BusinessCardFormData {
    company_id?: number;
    full_name: string;
    job_title?: string;
    department?: string;
    email: string;
    phone?: string;
    mobile?: string;
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: File;
    notes?: string;
    is_public?: boolean | 0 | 1;

    address_detail?: string;
    city?: string;
    state?: string;
    country?: string;
}

export interface PublicBusinessCard {
    id: number;
    slug: string;
    full_name: string;
    job_title?: string;
    email: string;
    phone?: string;
    mobile?: string;
    website?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: string;
    view_count: number;
    company?: {
        name: string;
        website?: string;
        logo?: string;
    } | null;
    address?: {
        address_detail?: string | null;
        country?: { code: string } | null;
        state?: { code: string } | null;
        city?: { code: string } | null;
    } | null;
}

export async function getBusinessCard(): Promise<BusinessCard | null> {
    const res = await api.get<BusinessCard>("/business-card");
    // Nếu API trả về null hoặc empty object
    if (!res.data || (typeof res.data === 'object' && Object.keys(res.data).length === 0)) {
        return null;
    }
    return res.data;
}

export async function saveBusinessCard(formData: BusinessCardFormData): Promise<BusinessCard> {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (value instanceof File) fd.append(key, value);
            else if (typeof value === "boolean") fd.append(key, value ? "1" : "0");
            else fd.append(key, String(value));
        }
    });
    const { data } = await api.post("/business-card", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export async function deleteBusinessCard(): Promise<void> {
    await api.delete("/business-card");
}

export async function getPublicBusinessCard(slug: string): Promise<PublicBusinessCard> {
    const { data } = await api.get(`/business-card/public/${slug}`);
    return data;
}

export async function connectWithCard(slug: string): Promise<any> {
    const { data } = await api.post(`/business-card/connect/${slug}`);
    return data;
}
