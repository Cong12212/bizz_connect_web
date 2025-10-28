'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirect to dashboard
                    navigate('/dashboard', { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-md text-center">
                {/* 404 Animation */}
                <div className="mb-8">
                    <div className="mb-4 text-9xl font-bold text-slate-900">
                        404
                    </div>
                    <div className="mb-2 text-2xl font-semibold text-slate-700">
                        Page Not Found
                    </div>
                    <p className="text-slate-600">
                        Oops! The page you're looking for doesn't exist.
                    </p>
                </div>

                {/* Countdown */}
                <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-2 text-sm text-slate-600">
                        Redirecting to dashboard in
                    </div>
                    <div className="text-5xl font-bold text-slate-900">
                        {countdown}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                        seconds
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/dashboard', { replace: true })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800"
                    >
                        <Home className="h-4 w-4" />
                        Go to Dashboard
                    </button>
                </div>

                {/* Quick Links */}
                <div className="mt-8 text-sm text-slate-600">
                    <p className="mb-3">You might be looking for:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => navigate('/contacts')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Contacts
                        </button>
                        <button
                            onClick={() => navigate('/reminders')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Reminders
                        </button>
                        <button
                            onClick={() => navigate('/tags')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Tags
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Notifications
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
