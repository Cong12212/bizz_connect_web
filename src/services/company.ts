import api from "./api";

export interface RefItem {
    id: number;
    code: string;
    name: string;
}

export interface Address {
    id: number;
    address_detail: string | null;
    city?: RefItem | null;
    state?: RefItem | null;
    country?: RefItem | null;
}

export interface Company {
    id: number;
    name: string;
    tax_code?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    description?: string | null;
    logo?: string | null;
    address_id?: number | null;
    address?: Address | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface CompanyFormData {
    name: string;
    tax_code?: string;
    phone?: string;
    email?: string;
    website?: string;
    description?: string;
    logo?: File;

    // gửi code để BE map sang address_id
    address_detail?: string;
    city?: string;    // code
    state?: string;   // code
    country?: string; // code
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
            if (value instanceof File) fd.append(key, value);
            else fd.append(key, String(value));
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
