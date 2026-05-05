// src/components/contacts/ContactList.tsx
import { useEffect, useRef, useState } from "react";
import type { Contact } from "../../services/contacts";
import { attachTags, detachTag } from "../../services/contacts";
import { listTags, type Tag } from "../../services/tags";
import useDebounced from "../../hooks/useDebounced";
import EmptyState from "../EmptyState";

/** List + unified number pager (mobile & desktop) */
export default function ContactList({
    items,
    total,
    page,
    last,
    onPage,
    selectedId,
    onSelect,
    onDelete,
    loading,
    token,
    onUpdated,
}: {
    items: Contact[];
    total: number;
    page: number;
    last: number;
    onPage: (p: number) => void;
    selectedId?: number | null;
    onSelect: (id: number) => void;
    loading?: boolean;
    token?: string;
    onUpdated?: (c: Contact) => void;
}) {
    const [ctxMenu, setCtxMenu] = useState<{ contact: Contact; x: number; y: number } | null>(null);

    return (
        <div className="relative flex h-full min-h-0 flex-col">
            {/* header */}
            <div className="flex-none px-3 pb-2 pt-3 text-xs text-slate-500">
                {loading && total === 0
                    ? <span className="inline-block h-3.5 w-20 animate-pulse rounded bg-slate-200" />
                    : `${total} contacts`
                }
            </div>

            {/* Scroll area */}
            <div className="flex-1 min-h-0 overflow-y-auto pb-24 md:pb-0">
                <ul className="px-2 pb-4">
                    {loading && items.length === 0
                        ? Array.from({ length: 8 }).map((_, i) => (
                            <li key={`sk-${i}`} className="mb-2 h-14 animate-pulse rounded-xl bg-slate-200" />
                        ))
                        : items.length ? (
                            items.map((c) => {
                                const active = selectedId === c.id;
                                return (
                                    <li key={c.id} className="group relative">
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-current={active ? "true" : undefined}
                                            onClick={() => onSelect(c.id)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") onSelect(c.id);
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setCtxMenu({ contact: c, x: e.clientX, y: e.clientY });
                                            }}
                                            className={`cursor-pointer rounded-xl px-3 py-2 text-left hover:bg-slate-100 ${active ? "bg-slate-100 ring-1 ring-slate-200" : ""}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-200 text-sm font-semibold">
                                                    {initials(c.name)}
                                                </div>

                                                <div className="min-w-0 flex-1">
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
                                                    <div className="truncate text-xs text-slate-500">
                                                        {c.job_title || c.company || c.email || c.phone || "—"}
                                                    </div>
                                                </div>

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

            {/* Desktop pager */}
            <div className="sticky bottom-0 z-10 hidden border-t bg-white p-3 md:flex md:justify-center">
                <NumberPager current={page} total={Math.max(1, last)} onPage={onPage} />
            </div>

            {/* Mobile pager */}
            <div
                className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 md:hidden"
                style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
                <div className="mx-auto flex max-w-[640px] justify-center">
                    <NumberPager current={page} total={Math.max(1, last)} onPage={onPage} />
                </div>
            </div>

            {/* Right-click context menu */}
            {ctxMenu && token && (
                <TagContextMenu
                    contact={ctxMenu.contact}
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    token={token}
                    onClose={() => setCtxMenu(null)}
                    onUpdated={(updated) => {
                        setCtxMenu(null);
                        onUpdated?.(updated);
                    }}
                />
            )}
        </div>
    );
}

/* ---------- Tag context menu ---------- */
function TagContextMenu({
    contact,
    x,
    y,
    token,
    onClose,
    onUpdated,
}: {
    contact: Contact;
    x: number;
    y: number;
    token: string;
    onClose: () => void;
    onUpdated: (c: Contact) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [q, setQ] = useState("");
    const qDeb = useDebounced(q, 250);
    const [tags, setTags] = useState<Tag[]>([]);
    const [fetching, setFetching] = useState(false);
    const [addingId, setAddingId] = useState<number | null>(null);
    const [removingId, setRemovingId] = useState<number | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const busy = addingId !== null || removingId !== null;

    const currentIds = new Set((contact.tags || []).map((t) => t.id));

    // Position: keep menu inside viewport
    const menuStyle: React.CSSProperties = {
        position: "fixed",
        zIndex: 9999,
        top: Math.min(y, window.innerHeight - 320),
        left: Math.min(x, window.innerWidth - 280),
    };

    // Close on click outside or Escape
    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [onClose]);

    // Focus input on open
    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    // Fetch tag suggestions
    useEffect(() => {
        let alive = true;
        setFetching(true);
        listTags({ q: qDeb || undefined }, token)
            .then((res) => { if (alive) setTags(res.data); })
            .catch(() => { })
            .finally(() => { if (alive) setFetching(false); });
        return () => { alive = false; };
    }, [qDeb, token]);

    async function attach(tagId: number) {
        if (currentIds.has(tagId) || busy) return;
        setAddingId(tagId);
        try {
            const updated = await attachTags(contact.id, { ids: [tagId] }, token);
            onUpdated(updated);
        } catch {
            setNotice("Failed to add tag");
        } finally {
            setAddingId(null);
        }
    }

    async function createAndAttach(name: string) {
        if (!name.trim() || busy) return;
        setAddingId(-1);
        try {
            const updated = await attachTags(contact.id, { names: [name.trim()] }, token);
            onUpdated(updated);
        } catch {
            setNotice("Failed to create tag");
        } finally {
            setAddingId(null);
        }
    }

    async function detach(tagId: number) {
        if (busy) return;
        setRemovingId(tagId);
        try {
            const updated = await detachTag(contact.id, tagId, token);
            onUpdated(updated);
        } catch {
            setNotice("Failed to remove tag");
        } finally {
            setRemovingId(null);
        }
    }

    const suggestions = tags.filter((t) => !currentIds.has(t.id));
    const canCreate = q.trim() && !tags.some((t) => t.name.toLowerCase() === q.trim().toLowerCase());

    return (
        <div ref={ref} style={menuStyle} className="w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="border-b bg-slate-50 px-3 py-2">
                <div className="text-xs font-semibold text-slate-700 truncate">
                    Add tag — {contact.name}
                </div>
            </div>

            {/* Current tags */}
            {(contact.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 border-b px-3 py-2">
                    {contact.tags!.map((t) => {
                        const isRemoving = removingId === t.id;
                        return (
                            <span
                                key={t.id}
                                className={`inline-flex items-center gap-1 rounded-full pl-2 pr-1 py-0.5 text-[11px] ring-1 transition-colors ${isRemoving ? "bg-red-600 text-white ring-red-700" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
                            >
                                #{t.name}
                                {isRemoving ? (
                                    <svg className="w-3 h-3 animate-spin text-white shrink-0" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                ) : (
                                    <button
                                        onClick={() => detach(t.id)}
                                        disabled={busy || removingId !== null}
                                        className="flex items-center justify-center rounded-full w-3.5 h-3.5 text-slate-400 hover:bg-slate-300 hover:text-slate-700 disabled:opacity-40 transition-colors"
                                        title={`Remove #${t.name}`}
                                    >
                                        ×
                                    </button>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Search */}
            <div className="px-3 pt-2 pb-1">
                <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && canCreate) createAndAttach(q);
                    }}
                    placeholder="Search or create tag…"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                    disabled={busy}
                />
            </div>

            {/* Suggestions list */}
            <div className="max-h-44 overflow-y-auto px-1 pb-1">
                {fetching && (
                    <div className="space-y-1 px-1 py-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
                        ))}
                    </div>
                )}

                {!fetching && suggestions.length === 0 && !canCreate && !busy && (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                        {q ? "No matching tags" : "All tags already applied"}
                    </div>
                )}

                {!fetching && suggestions.map((t) => {
                    const isAdding = addingId === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => attach(t.id)}
                            disabled={busy}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                            <span className="text-slate-400">#</span>
                            <span className="flex-1 truncate">{t.name}</span>
                            {isAdding ? (
                                <svg className="w-3.5 h-3.5 animate-spin text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                            ) : (
                                t.contacts_count !== undefined && (
                                    <span className="text-xs text-slate-400">{t.contacts_count}</span>
                                )
                            )}
                        </button>
                    );
                })}

                {!fetching && canCreate && (
                    <button
                        onClick={() => createAndAttach(q)}
                        disabled={busy}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                        {addingId === -1 ? (
                            <svg className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                        ) : (
                            <span className="text-emerald-500">+</span>
                        )}
                        Create "{q.trim()}"
                    </button>
                )}
            </div>

            {/* Footer */}
            {notice && (
                <div className="border-t px-3 py-1.5 text-xs text-slate-500">
                    {notice}
                </div>
            )}
        </div>
    );
}

/* ---------- Helpers ---------- */
function initials(name?: string) {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

function getVisiblePages(current: number, total: number, max = 7): (number | "...")[] {
    if (total <= max) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(max / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + max - 1);
    start = Math.max(1, end - max + 1);
    const pages: (number | "...")[] = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push("..."); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push("..."); pages.push(total); }
    return pages;
}

function NumberPager({ current, total, onPage }: { current: number; total: number; onPage: (p: number) => void }) {
    const pages = getVisiblePages(current, total, 7);
    const btn = "px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed";
    return (
        <div className="mx-auto inline-flex items-center overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
            <button onClick={() => onPage(1)} disabled={current <= 1} className={btn} aria-label="First">«</button>
            <button onClick={() => onPage(Math.max(1, current - 1))} disabled={current <= 1} className={btn} aria-label="Prev">‹</button>
            <div className="flex items-center divide-x divide-slate-200">
                {pages.map((n, i) =>
                    n === "..." ? (
                        <span key={`dots-${i}`} className="px-2 text-sm text-slate-500">…</span>
                    ) : (
                        <button
                            key={`p-${n}`}
                            aria-current={n === current ? "page" : undefined}
                            onClick={() => n !== current && onPage(n)}
                            className={`${btn} ${n === current ? "bg-blue-50 text-blue-600 ring-1 ring-blue-400" : "hover:bg-slate-50"}`}
                        >
                            {n}
                        </button>
                    )
                )}
            </div>
            <button onClick={() => onPage(Math.min(total, current + 1))} disabled={current >= total} className={btn} aria-label="Next">›</button>
            <button onClick={() => onPage(total)} disabled={current >= total} className={btn} aria-label="Last">»</button>
        </div>
    );
}
