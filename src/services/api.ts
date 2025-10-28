import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Helper if you still want to manually set in some places
export function setAuthToken(token?: string) {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete api.defaults.headers.common.Authorization;
}

// Always read the latest token before each request
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("bc_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        else delete config.headers.Authorization;
    }
    return config;
});

export default api;
