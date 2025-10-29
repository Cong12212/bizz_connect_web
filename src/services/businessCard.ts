import api from "./api";

export interface BusinessCard {
    id: number;
    user_id: number;
    company_id?: number;
    slug?: string;
    full_name: string;
    job_title?: string;
    department?: string;
    email: string;
    phone?: string;
    mobile?: string;
    website?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: string;
    notes?: string;
    is_public?: boolean;
    view_count?: number;
    created_at: string;
    updated_at: string;
    company?: any;
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
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: File;
    notes?: string;
    is_public?: boolean;
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
    company?: {
        name: string;
        industry?: string;
        website?: string;
        logo?: string;
    };
    view_count: number;
}

export async function getBusinessCard(): Promise<BusinessCard | null> {
    try {
        const { data } = await api.get("/business-card");
        return data;
    } catch (e: any) {
        if (e?.response?.status === 204) return null;
        throw e;
    }
}

export async function saveBusinessCard(formData: BusinessCardFormData): Promise<BusinessCard> {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (value instanceof File) {
                fd.append(key, value);
            } else if (typeof value === 'boolean') {
                fd.append(key, value ? '1' : '0');
            } else {
                fd.append(key, String(value));
            }
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
