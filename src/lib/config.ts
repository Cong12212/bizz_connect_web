// src/lib/config.ts
let _API_URL: string | null = null;

/** Lấy API base URL (đa nền tảng + cache) */
export function pickApiBaseUrl(): string {
    if (_API_URL !== null) return _API_URL;

    // Vite: phải truy cập tĩnh để bundler inline biến
    let fromVite = '';
    try {
        fromVite =
            import.meta.env.VITE_API_BASE_URL ||
            import.meta.env.VITE_API_URL ||
            '';
    } catch { }

    // Next/CRA
    const procEnv: any = (globalThis as any)?.process?.env || {};
    const fromNext = procEnv.NEXT_PUBLIC_API_URL || '';
    const fromCRA = procEnv.REACT_APP_API_URL || '';

    // Runtime /public/config.js
    const fromWin =
        typeof window !== 'undefined'
            ? ((window as any).VITE_API_BASE_URL || (window as any).API_BASE_URL || '')
            : '';

    const raw = fromVite || fromNext || fromCRA || fromWin || '';
    _API_URL = raw ? String(raw).replace(/\/$/, '') : '';
    return _API_URL;
}

export function assertApiUrl(): string {
    const base = pickApiBaseUrl();
    if (!base) {
        throw new Error(
            [
                'Missing API base URL.',
                'Set one of:',
                ' - Vite: .env  -> VITE_API_BASE_URL=http://127.0.0.1:8000/api',
                ' - Next: NEXT_PUBLIC_API_URL=...',
                ' - CRA:  REACT_APP_API_URL=...',
                " - Or /public/config.js -> window.VITE_API_BASE_URL='...'",
            ].join('\n')
        );
    }
    return base;
}
