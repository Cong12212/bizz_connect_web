// src/components/contacts/ContactList.tsx
import React from "react";
import type { Contact } from "../../services/contacts";
import EmptyState from "../EmptyState";

/** List + unified number pager (mobile & desktop) */
export default function ContactList({
    items,
    total,
    page,
    last,
    onPage,
    selectedId,          // 👈 có thể undefined
    onSelect,
    onDelete,
    loading,
}: {
    items: Contact[];
    total: number;
    page: number;
    last: number;
    onPage: (p: number) => void;
    selectedId?: number | null;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
    loading?: boolean;
}) {
    return (
        <div className="relative flex h-full min-h-0 flex-col">
            {/* header */}
            <div className="flex-none px-3 pb-2 pt-3 text-xs text-slate-500">
                {total} contacts
            </div>

            {/* vùng cuộn — chừa chỗ cho mobile pager cố định */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-0">
                <ul className="px-2 pb-4">
                    {loading
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <li key={`sk-${i}`} className="mb-2 h-14 animate-pulse rounded-xl bg-slate-200" />
                        ))
                        : items.length ? (
                            items.map((c) => {
                                const active = selectedId === c.id;
                                return (
                                    <li key={c.id} className="group relative">
                                        {/* KHÔNG bọc toàn item bằng <button> để tránh nested button */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-current={active ? "true" : undefined}
                                            onClick={() => onSelect(c.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") onSelect(c.id);
                                            }}
                                            className={`cursor-pointer rounded-xl px-3 py-2 text-left hover:bg-slate-100 ${active ? "bg-slate-100 ring-1 ring-slate-200" : ""
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-semibold">
                                                    {initials(c.name)}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    {/* Hàng: Tên + #tags (nếu có) */}
                                                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                                        <div className="max-w-[60%] truncate text-sm font-medium">
                                                            {c.name}
                                                        </div>
                                                        {Array.isArray(c.tags) && c.tags.length > 0 && (
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {c.tags.map((t) => (
                                                                    <span
                                                                        key={t.id}
                                                                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 ring-1 ring-slate-200"
                                                                    >
                                                                        #{t.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Dòng phụ: job/company/email/phone */}
                                                    <div className="truncate text-xs text-slate-500">
                                                        {c.job_title || c.company || c.email || c.phone || "—"}
                                                    </div>
                                                </div>

                                                {/* Delete: mobile luôn hiện; desktop hiện khi hover */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDelete(c.id);
                                                    }}
                                                    className="inline-flex rounded-md bg-white/80 px-2 py-1 text-xs text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="p-6">
                                <EmptyState title="No results" subtitle="Try another keyword or add new contact." />
                            </li>
                        )}
                </ul>
            </div>

            {/* Desktop pager: sticky & căn giữa */}
            <div className="sticky bottom-0 z-10 hidden border-t bg-white p-3 md:flex md:justify-center">
                <NumberPager current={page} total={Math.max(1, last)} onPage={onPage} />
            </div>

            {/* Mobile pager: FIXED & căn giữa */}
            <div
                className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 md:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-[640px] justify-center">
                    <NumberPager current={page} total={Math.max(1, last)} onPage={onPage} />
                </div>
            </div>
        </div>
    );
}

/* ---------- Helpers ---------- */
function initials(name?: string) {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

/** Trả về chuỗi trang dạng [1, '...', 7, 8, 9, '...', 20] */
function getVisiblePages(current: number, total: number, max = 7): (number | "...")[] {
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);

    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);

    const pages: (number | "...")[] = [];
    if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) {
        if (end < total - 1) pages.push("...");
        pages.push(total);
    }
    return pages;
}

function NumberPager({
    current,
    total,
    onPage,
}: {
    current: number;
    total: number;
    onPage: (p: number) => void;
}) {
    const pages = getVisiblePages(current, total, 7);
    const btn =
        "px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <div className="mx-auto inline-flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            {/* First & Prev */}
            <button onClick={() => onPage(1)} disabled={current <= 1} className={btn} aria-label="First">
                «
            </button>
            <button
                onClick={() => onPage(Math.max(1, current - 1))}
                disabled={current <= 1}
                className={btn}
                aria-label="Prev"
            >
                ‹
            </button>

            {/* numbers */}
            <div className="flex items-center divide-x divide-slate-200">
                {pages.map((n, i) =>
                    n === "..." ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-slate-500">
                            …
                        </span>
                    ) : (
                        <button
                            key={`p-${n}`}
                            aria-current={n === current ? "page" : undefined}
                            onClick={() => n !== current && onPage(n)}
                            className={`${btn} ${n === current ? "bg-blue-50 text-blue-600 ring-1 ring-blue-400" : "hover:bg-slate-50"
                                }`}
                        >
                            {n}
                        </button>
                    )
                )}
            </div>

            {/* Next & Last */}
            <button
                onClick={() => onPage(Math.min(total, current + 1))}
                disabled={current >= total}
                className={btn}
                aria-label="Next"
            >
                ›
            </button>
            <button onClick={() => onPage(total)} disabled={current >= total} className={btn} aria-label="Last">
                »
            </button>
        </div>
    );
}
