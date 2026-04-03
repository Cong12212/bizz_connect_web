export function getToken(): string {
    if (typeof window === "undefined") return "";
    // check multiple keys for flexibility
    const keys = ["auth_token", "token", "access_token", "jwt", "bearer"];
    for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v) return v;
    }
    return "";
}
export function setToken(t: string) {
    if (typeof window !== "undefined") localStorage.setItem("auth_token", t);
}
