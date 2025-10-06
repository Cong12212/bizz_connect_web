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

    // 🔒 KHÔNG gọi hook conditionally. Luôn gọi, nhưng guard bên trong.
    useEffect(() => {
        if (!token) return;                          // khách → không gọi meThunk
        if (verified === null && !fired.current) {   // đã có token nhưng chưa biết verified
            fired.current = true;
            dispatch(meThunk());
        }
    }, [token, verified, dispatch]);

    // === Render ===
    // Chưa đăng nhập -> cho vào trang Auth
    if (!token) return <>{children}</>;

    // Có token nhưng chưa biết verified -> tạm show loader
    if (verified === null || status === 'loading') return <MiniLoader />;

    // Đã biết verified -> điều hướng phù hợp
    return <Navigate to={verified ? '/dashboard' : '/verify-email'} replace />;
}
