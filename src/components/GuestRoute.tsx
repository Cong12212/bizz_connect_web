'use client';
import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { meThunk } from '../features/auth/authSlice';

function MiniLoader() {
    return (
        <div className="grid h-24 place-items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
    );
}

export default function GuestRoute({ children }: { children?: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const { token, verified, status } = useAppSelector((s) => s.auth);
    const fired = useRef(false);

    useEffect(() => {
        if (!token) return;
        if (verified === null && !fired.current) {
            fired.current = true;
            dispatch(meThunk());
        }
    }, [token, verified, dispatch]);

    // 1) No token → allow guest access
    if (!token) return <>{children}</>;

    // Loading auth state
    if (verified === null || status === 'loading') return <MiniLoader />;

    // Has token: redirect based on verification status
    if (verified) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/verify-email" replace />;
}
