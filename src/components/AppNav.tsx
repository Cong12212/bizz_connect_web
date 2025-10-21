// src/components/AppNav.tsx
import { NavLink, useNavigate } from "react-router-dom";
import { Home as HomeIcon, Users, Bell, Tag, ChartBar, Menu, Settings } from "lucide-react";
import React from "react";

type Props = {
    variant: "sidebar" | "mobile";
    onOpenSettings?: () => void;           // ⬅️ đổi tên prop
    className?: string;
};

type LinkItem = {
    to: string;
    label: string;
    Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

// KHÔNG có Settings trong links nữa (vì là button riêng)
const links: LinkItem[] = [
    { to: "/dashboard", label: "Home", Icon: HomeIcon },
    { to: "/contacts", label: "Contacts", Icon: Users },
    { to: "/tags", label: "Tags", Icon: Tag },
    { to: "/reminders", label: "Reminders", Icon: ChartBar },
    { to: "/notifications", label: "Notifications", Icon: Bell },
];

export default function AppNav({ variant, onOpenSettings, className }: Props) {
    const navigate = useNavigate();
    const goSettings = () => (onOpenSettings ? onOpenSettings() : navigate("/settings"));

    if (variant === "mobile") {
        return (
            <div
                className={
                    className ??
                    "flex items-center justify-between px-4 py-3 text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700"
                }
            >
                <div className="text-lg font-semibold">BizConnect</div>

                <details className="relative">
                    <summary
                        aria-label="Open menu"
                        className="list-none cursor-pointer rounded-xl bg-white/15 px-3 py-1.5 hover:bg-white/20"
                    >
                        <Menu className="h-5 w-5" aria-hidden />
                    </summary>

                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl bg-white p-2 text-slate-900 shadow-lg ring-1 ring-black/5">
                        {links.map(({ to, label, Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    [
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                                        isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100",
                                    ].join(" ")
                                }
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                                {label}
                            </NavLink>
                        ))}

                        {/* Button Settings thay cho New contact */}
                        <button
                            onClick={goSettings}
                            className="mt-2 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left hover:bg-slate-50"
                        >
                            <Settings className="h-4 w-4" aria-hidden /> Settings
                        </button>
                    </div>
                </details>
            </div>
        );
    }

    // Sidebar (Desktop)
    return (
        <aside
            className={
                className ??
                "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-gradient-to-b from-sky-600 via-indigo-600 to-indigo-700 p-4 text-white md:flex"
            }
        >
            <div className="mb-4 px-1 text-xl font-semibold tracking-wide">BizConnect</div>

            <nav className="flex-1 space-y-2 px-1">
                {links.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            [
                                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                                isActive ? "bg-white text-slate-900 shadow ring-1 ring-white/60" : "text-white/90 hover:bg-white/10",
                            ].join(" ")
                        }
                    >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Button Settings ở vị trí nút New contact cũ */}
            <button
                onClick={goSettings}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 px-3 py-2 font-semibold text-slate-900 shadow hover:bg-white"
            >
                <Settings className="h-4 w-4" aria-hidden /> Settings
            </button>
        </aside>
    );
}
