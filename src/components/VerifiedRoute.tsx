'use client';
import React, { useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../utils/hooks';
import { meThunk } from '../features/auth/authSlice';

function MiniLoader() {
    return (
        <div className="grid h-24 place-items-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
    );
}

export default function VerifiedRoute({ children }: { children?: React.ReactNode }) {
    const dispatch = useAppDispatch();
    const { token, verified, status } = useAppSelector((s) => s.auth);
    const fired = useRef(false);

    // Luôn gọi hook; guard trong body
    useEffect(() => {
        if (!token) return;                          // khách -> không call meThunk
        if (verified === null && !fired.current) {
            fired.current = true;
            dispatch(meThunk());
        }
    }, [token, verified, dispatch]);

    // === Render ===
    if (!token) return <Navigate to="/auth" replace />;
    if (verified === null || status === 'loading') return <MiniLoader />;
    if (!verified) return <Navigate to="/verify-email" replace />;

    // Đã đăng nhập & verified
    return children ? <>{children}</> : <Outlet />;
}
