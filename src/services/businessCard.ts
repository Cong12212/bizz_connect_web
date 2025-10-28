import api from "./api";

export interface BusinessCard {
    id: number;
    user_id: number;
    company_id?: number;
    full_name: string;
    job_title?: string;
    department?: string;
    email: string;
    phone?: string;
    mobile?: string;
    website?: string;
    address?: string;
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: string;
    notes?: string;
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
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    avatar?: File;
    notes?: string;
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
