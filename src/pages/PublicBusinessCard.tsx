import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublicBusinessCard, type PublicBusinessCard } from "@/services/businessCard";
import { useAppSelector } from "@/utils/hooks";
import {
    EnvelopeIcon,
    PhoneIcon,
    DevicePhoneMobileIcon,
    GlobeAltIcon,
    BuildingOfficeIcon,
    EyeIcon,
} from "@heroicons/react/24/outline";

export default function PublicBusinessCardPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const isAuthenticated = useAppSelector((s) => !!s.auth.token);

    const [card, setCard] = useState<PublicBusinessCard | null>(null);
    const [loading, setLoading] = useState(true);
    const [requiresAuth, setRequiresAuth] = useState(false);

    useEffect(() => {
        if (slug) {
            loadCard();
        }
    }, [slug]);

    async function loadCard() {
        try {
            setLoading(true);
            const data = await getPublicBusinessCard(slug!);
            setCard(data);
            setRequiresAuth(false);
        } catch (e: any) {
            // If 401 Unauthenticated, show auth prompt instead of error
            if (e?.response?.status === 401) {
                setRequiresAuth(true);
            }
        } finally {
            setLoading(false);
        }
    }

    function handleConnect() {
        if (!isAuthenticated) return;

        const prefillData = {
            name: card!.full_name,
            email: card!.email || "",
            phone: card!.phone || card!.mobile || "",
            company: card!.company?.name || "",
            job_title: card!.job_title || "",
            notes: "",
            linkedin_url: card!.linkedin || "",
            website_url: card!.website || "",
            source: "business_card",

            // ⬇️ patch address vào state để form nhận
            address_detail: card?.address?.address_detail || "",     // hoặc card?.address_text nếu BE trả free-text
            country: card?.address?.country?.code || "",
            state: card?.address?.state?.code || "",
            city: card?.address?.city?.code || "",
        };

        navigate("/contacts", {
            state: { openCreateSheet: true, prefillData },
        });
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show auth required screen
    if (requiresAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
                <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-xl text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-slate-900">Login Required</h1>
                    <p className="mb-6 text-slate-600">
                        You need to be logged in to view this business card and connect with the owner.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/auth?redirect=/card/${slug}`)}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white font-semibold hover:from-blue-700 hover:to-blue-800"
                        >
                            Log in
                        </button>
                        <button
                            onClick={() => navigate(`/auth?mode=register&redirect=/card/${slug}`)}
                            className="w-full rounded-lg border-2 border-blue-600 py-3 text-blue-600 font-semibold hover:bg-blue-50"
                        >
                            Create Account
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If no card data (other errors)
    if (!card) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-900">Card Not Found</h1>
                    <p className="mt-2 text-slate-600">This business card doesn't exist</p>
                    <button
                        onClick={() => navigate("/")}
                        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4">
            <div className="mx-auto max-w-2xl">
                {/* Business Card */}
                <div className="overflow-hidden rounded-2xl border bg-white shadow-xl">
                    {/* Header with company logo */}
                    {card.company?.logo && (
                        <div className="border-b bg-gradient-to-r from-slate-50 to-white p-6">
                            <img src={card.company.logo} alt={card.company.name} className="h-16 w-auto" />
                        </div>
                    )}

                    {/* Avatar & Name */}
                    <div className="relative p-8 text-center">
                        {card.avatar ? (
                            <img
                                src={card.avatar}
                                alt={card.full_name}
                                className="mx-auto h-24 w-24 rounded-full border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-3xl font-bold text-white shadow-lg">
                                {card.full_name.charAt(0)}
                            </div>
                        )}
                        <h1 className="mt-4 text-2xl font-bold text-slate-900">{card.full_name}</h1>
                        {card.job_title && <p className="text-slate-600">{card.job_title}</p>}
                        {card.company && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                <BuildingOfficeIcon className="h-4 w-4" />
                                {card.company.name}
                            </div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="border-t p-6 space-y-3">
                        {card.email && (
                            <a
                                href={`mailto:${card.email}`}
                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                            >
                                <EnvelopeIcon className="h-5 w-5 text-slate-600" />
                                <span className="text-sm text-slate-900">{card.email}</span>
                            </a>
                        )}
                        {card.phone && (
                            <a
                                href={`tel:${card.phone}`}
                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                            >
                                <PhoneIcon className="h-5 w-5 text-slate-600" />
                                <span className="text-sm text-slate-900">{card.phone}</span>
                            </a>
                        )}
                        {card.mobile && (
                            <a
                                href={`tel:${card.mobile}`}
                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                            >
                                <DevicePhoneMobileIcon className="h-5 w-5 text-slate-600" />
                                <span className="text-sm text-slate-900">{card.mobile}</span>
                            </a>
                        )}
                        {card.website && (
                            <a
                                href={card.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                            >
                                <GlobeAltIcon className="h-5 w-5 text-slate-600" />
                                <span className="text-sm text-slate-900">{card.website}</span>
                            </a>
                        )}
                        {card.linkedin && (
                            <a
                                href={card.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50"
                            >
                                <svg className="h-5 w-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                                <span className="text-sm text-slate-900">LinkedIn</span>
                            </a>
                        )}
                    </div>

                    {/* Connect Button */}
                    <div className="border-t p-6">
                        <button
                            onClick={handleConnect}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-white font-semibold hover:from-blue-700 hover:to-blue-800"
                        >
                            {isAuthenticated ? "Add to Contacts" : "Sign up to Connect"}
                        </button>
                        {!isAuthenticated && (
                            <p className="mt-2 text-center text-xs text-slate-600">
                                Already have an account? <button onClick={() => navigate(`/auth?redirect=/card/${slug}`)} className="text-blue-600 hover:underline">Log in</button>
                            </p>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="border-t bg-slate-50 p-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                            <EyeIcon className="h-4 w-4" />
                            <span>{card.view_count} views</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-slate-600">
                    <p>Powered by BizzConnect</p>
                </div>
            </div>
        </div>
    );
}
