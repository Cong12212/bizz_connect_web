"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "../components/AppNav";
import useDebounced from "../hooks/useDebounced";
import { useAppSelector } from "../utils/hooks";
import {
    listContacts,
    getContact,
    deleteContact,
    type Contact,
} from "../services/contacts";
import ContactList from "../components/contacts/ContactList";
import ContactDetail from "../components/contacts/ContactDetail";
import EditContactSheet from "../components/contacts/EditContactSheet";
import EmptyState from "../components/EmptyState";
import useMediaQuery from "../hooks/useMediaQuery";
import ContactDetailModal from "../components/contacts/ContactDetailModal";

export default function ContactsPage() {
    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken ||
        (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const [q, setQ] = useState("");
    const qDebounced = useDebounced(q, 300);
    const [page, setPage] = useState(1);
    const [per] = useState(30);
    const [sort, setSort] = useState<"name" | "-name" | "id" | "-id">("name");

    const [data, setData] = useState<{ items: Contact[]; total: number; last: number }>(
        { items: [], total: 0, last: 1 }
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<Contact | null>(null);

    const [openEdit, setOpenEdit] = useState(false);
    const isMobile = useMediaQuery("(max-width: 767.98px)");
    const [openDetailMobile, setOpenDetailMobile] = useState(false);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        listContacts({ q: qDebounced, page, per_page: per, sort }, token)
            .then((res) => {
                if (!active) return;
                setData({ items: res.data, total: res.total, last: res.last_page });

                if (selectedId) {
                    const found = res.data.find((c) => c.id === selectedId) || null;
                    if (found) setSelected(found);
                }
            })
            .catch((e) => setError(e?.message || "Failed to load"))
            .finally(() => setLoading(false));
        return () => { active = false; };
    }, [qDebounced, page, per, sort, token]);

    // fetch full when chọn
    useEffect(() => {
        if (!selectedId) return;
        getContact(selectedId, token)
            .then((full) => setSelected(full))
            .catch(() => {
                const fallback = data.items.find((x) => x.id === selectedId) || null;
                setSelected(fallback);
            });
    }, [selectedId]);

    const list = useMemo(() => data.items, [data.items]);

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" onNewContact={() => setOpenEdit(true)} />
            </div>
            <AppNav variant="sidebar" onNewContact={() => setOpenEdit(true)} />

            {/* cột dọc: toolbar cố định + content scroll */}
            <main className="md:ml-64 flex h-screen flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex-none flex items-center gap-3 border-b bg-white/70 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/40">
                    <h1 className="hidden text-lg font-semibold sm:block">Contacts</h1>
                    <div className="relative w-[min(520px,80vw)]">
                        <input
                            value={q}
                            onChange={(e) => { setPage(1); setQ(e.target.value); }}
                            placeholder="Search name, email, phone…"
                            className="w-full rounded-xl border bg-white px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as any)}
                        className="rounded-xl border bg-white px-3 py-2"
                    >
                        <option value="name">Name A→Z</option>
                        <option value="-name">Name Z→A</option>
                        <option value="-id">Newest</option>
                        <option value="id">Oldest</option>
                    </select>
                    <button
                        onClick={() => { setSelected(null); setOpenEdit(true); }}
                        className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                    >
                        New
                    </button>
                </div>

                {/* Content */}
                <div className="grid flex-1 min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
                    {/* LEFT: list */}
                    <section className="min-h-0 overflow-hidden border-r bg-white">
                        <ContactList
                            items={list}
                            total={data.total}
                            page={page}
                            last={data.last}
                            loading={loading}                // <-- thêm
                            onPage={setPage}
                            selectedId={selectedId}
                            onSelect={(id) => {
                                const found = list.find((x) => x.id === id);
                                if (found) setSelected(found);
                                setSelectedId(id);
                                if (isMobile) setOpenDetailMobile(true);
                            }}
                            onDelete={async (id) => {
                                if (!confirm("Delete this contact?")) return;
                                await deleteContact(id, token);
                                setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
                                if (selectedId === id) { setSelectedId(null); setSelected(null); }
                            }}
                        />
                    </section>


                    {/* RIGHT: detail (desktop only) */}
                    <section className="hidden overflow-y-auto p-6 md:block">
                        {selected ? (
                            <ContactDetail
                                contact={selected}
                                onEdit={() => setOpenEdit(true)}
                                onUpdated={(c) => {
                                    setSelected(c);
                                    setData((d) => ({ ...d, items: d.items.map((x) => (x.id === c.id ? c : x)) }));
                                }}
                            />
                        ) : (
                            <div className="grid h-full place-items-center text-center text-slate-500">
                                <div>
                                    <div className="mb-2 text-4xl">👤</div>
                                    <div className="text-lg font-medium">Chọn 1 liên hệ ở bên trái để xem chi tiết</div>
                                    <div className="text-sm">Hoặc tạo liên hệ mới</div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Modal detail cho mobile */}
            <ContactDetailModal
                open={openDetailMobile}
                contact={selected}
                onClose={() => setOpenDetailMobile(false)}
                onEdit={() => { setOpenDetailMobile(false); setOpenEdit(true); }}
                onUpdated={(c) => {
                    setSelected(c);
                    setData((d) => ({ ...d, items: d.items.map((x) => (x.id === c.id ? c : x)) }));
                }}
            />

            {/* Create / Edit sheet */}
            <EditContactSheet
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                token={token}
                contact={selected}
                onSaved={(c) => {
                    setOpenEdit(false);
                    setSelected(c);
                    setSelectedId(c.id);
                    setData((d) => {
                        const exists = d.items.some((x) => x.id === c.id);
                        return exists
                            ? { ...d, items: d.items.map((x) => (x.id === c.id ? c : x)) }
                            : { ...d, items: [c, ...d.items] };
                    });
                }}
            />
        </div>
    );
}
