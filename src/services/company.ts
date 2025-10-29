import api from "./api";

export interface Company {
    id: number;
    user_id: number;
    name: string;
    domain?: string;
    industry?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    logo?: string;
    plan: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyFormData {
    name: string;
    domain?: string;
    industry?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    logo?: File;
}

export async function getCompany(): Promise<Company | null> {
    try {
        const { data } = await api.get("/company");
        return data;
    } catch (e: any) {
        if (e?.response?.status === 204) return null;
        throw e;
    }
}

export async function saveCompany(formData: CompanyFormData): Promise<Company> {
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
    const { data } = await api.post("/company", fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
}

export async function deleteCompany(): Promise<void> {
    await api.delete("/company");
}
