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

    // 1) KHÔNG token -> cho vào trang khách
    if (!token) return <>{children}</>;

    // đang load trạng thái
    if (verified === null || status === 'loading') return <MiniLoader />;

    // Có token:
    // - verified -> đá sang app
    if (verified) return <Navigate to="/dashboard" replace />;
    // - chưa verified -> đá sang verify
    return <Navigate to="/verify-email" replace />;
}
