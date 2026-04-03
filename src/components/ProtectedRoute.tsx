// src/components/guards/ProtectedRoute.tsx
'use client';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../src/utils/hooks';
import { meThunk, setToken } from '../features/auth/authSlice';
import api from '../services/api';

function Loader() {
    return (
        <div className="grid h-screen place-items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-900" />
        </div>
    );
}

export default function ProtectedRoute() {
    const dispatch = useAppDispatch();
    const loc = useLocation();
    const { token, user, status } = useAppSelector((s) => s.auth);
    const bootedRef = useRef(false);

    // Sync token from localStorage into Redux if not yet set
    useEffect(() => {
        if (!token && typeof window !== 'undefined') {
            const saved = localStorage.getItem('bc_token');
            if (saved) {
                dispatch(setToken(saved));
                (api.defaults.headers as any).common = {
                    ...(api.defaults.headers as any).common,
                    Authorization: `Bearer ${saved}`,
                };
            }
        }
    }, [token, dispatch]);

    // Fetch current user exactly once when token is present but user is not loaded
    useEffect(() => {
        if (!bootedRef.current && (token || (typeof window !== 'undefined' && localStorage.getItem('bc_token')))) {
            if (!user && status !== 'loading') {
                bootedRef.current = true;
                dispatch(meThunk());
            }
        }
    }, [token, user, status, dispatch]);

    const hasToken = !!(token || (typeof window !== 'undefined' && localStorage.getItem('bc_token')));

    // No token → redirect to /auth
    if (!hasToken) return <Navigate to="/auth" replace state={{ from: loc }} />;

    // Token present but still syncing /auth/me
    if (!user && status === 'loading') return <Loader />;

    // Token and user loaded → allow access
    return <Outlet />;
}
