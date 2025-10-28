"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import useMediaQuery from "../hooks/useMediaQuery";
import ContactDetailModal from "../components/contacts/ContactDetailModal";
import ImportContactsModal from "../components/contacts/ImportContactsModal";
import ExportContactsModal from "../components/contacts/ExportContactsModal";

export default function ContactsPage() {
    const nav = useNavigate();
    const { id: idParam } = useParams();            // /contacts/:id
    const routeId = idParam ? parseInt(idParam, 10) : null;
    const [refreshKey, setRefreshKey] = useState(0);
    const reduxToken = useAppSelector((s) => s.auth.token);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const token =
        reduxToken ||
        (typeof window !== "undefined" ? localStorage.getItem("bc_token") || "" : "");

    const [q, setQ] = useState("");
    const qDebounced = useDebounced(q, 300);
    const [page, setPage] = useState(1);
    const [per] = useState(30);
    const [sort, setSort] = useState<"name" | "-name" | "id" | "-id">("name");

    const [data, setData] = useState<{ items: Contact[]; total: number; last: number }>({
        items: [],
        total: 0,
        last: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const selectedId = routeId;
    const [selected, setSelected] = useState<Contact | null>(null);

    // TÁCH đối tượng đang chỉnh: null => tạo mới; object => sửa
    const [editTarget, setEditTarget] = useState<Contact | null>(null);

    const isMobile = useMediaQuery("(max-width: 767.98px)");
    const [openDetailMobile, setOpenDetailMobile] = useState(false);

    const [openImport, setOpenImport] = useState(false);
    const [openExport, setOpenExport] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    // load list
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        listContacts({ q: qDebounced, page, per_page: per, sort }, token)
            .then((res) => {
                if (!active) return;
                setData({ items: res.data, total: res.total, last: res.last_page });
            })
            .catch((e) => setError(e?.message || "Failed to load"))
            .finally(() => setLoading(false));
        return () => {
            active = false;
        };
    }, [qDebounced, page, per, sort, token, refreshKey]);

    // fetch full khi chọn item khác
    useEffect(() => {
        if (!selectedId) {
            setSelected(null);
            setOpenDetailMobile(false);
            return;
        }

        // Check if data already exists in list
        const cached = data.items.find((x) => x.id === selectedId);
        if (cached) {
            setSelected(cached); // Display data from list immediately
        }

        // Fetch full detail
        setLoadingDetail(true); // Only loading detail
        getContact(selectedId, token)
            .then((full) => setSelected(full))
            .catch(() => {
                const fallback = data.items.find((x) => x.id === selectedId) || null;
                setSelected(fallback);
            })
            .finally(() => setLoadingDetail(false));

        if (isMobile) setOpenDetailMobile(true);
    }, [selectedId, token, data.items]);

    const list = useMemo(() => data.items, [data.items]);

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            {/* Mobile top */}
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            {/* Sidebar */}
            <AppNav variant="sidebar" />

            {/* MAIN */}
            <main className="md:ml-64 flex h-screen flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="flex-none flex items-center gap-3 border-b bg-white/70 p-3 backdrop-blur supports-[backdrop-filter]:bg-white/40">
                    <h1 className="hidden text-lg font-semibold sm:block">Contacts</h1>

                    <div className="relative w-[min(520px,80vw)]">
                        <input
                            value={q}
                            onChange={(e) => {
                                setPage(1);
                                setQ(e.target.value);
                            }}
                            placeholder="Search name, email, phone…"
                            className="w-full rounded-xl border bg-white px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-slate-300"
                        />
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            🔎
                        </span>
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

                    <button onClick={() => setOpenExport(true)} className="rounded-xl border px-3 py-2">
                        Export
                    </button>
                    <button onClick={() => setOpenImport(true)} className="rounded-xl border px-3 py-2">
                        Import
                    </button>

                    <button
                        onClick={() => {
                            setEditTarget(null);   // ➜ tạo mới
                            setOpenEdit(true);
                        }}
                        className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                    >
                        New
                    </button>
                </div>

                {/* Content */}
                <div className="grid flex-1 min-h-0 grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
                    {/* LEFT: list */}
                    <section className="min-h-0 overflow-hidden border-r bg-white">
                        {error && (
                            <div className="m-3 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
                        )}
                        <ContactList
                            items={list}
                            total={data.total}
                            page={page}
                            last={data.last}
                            loading={loading}
                            onPage={setPage}
                            selectedId={selectedId}
                            onSelect={(id) => nav(`/contacts/${id}`)}        // dùng router
                            onDelete={async (id) => {
                                if (!confirm("Delete this contact?")) return;
                                await deleteContact(id, token);
                                setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
                                if (selectedId === id) nav("/contacts");
                            }}
                        />
                    </section>

                    {/* RIGHT: detail (desktop) */}
                    <section className="hidden overflow-y-auto p-6 md:block">
                        {loadingDetail ? ( // Separate loading for detail
                            <div className="grid h-full place-items-center text-slate-500">
                                <div>Loading...</div>
                            </div>
                        ) : selected ? (
                            <ContactDetail
                                contact={selected}
                                onEdit={() => {
                                    setEditTarget(selected);
                                    setOpenEdit(true);
                                }}
                                onUpdated={(c) => {
                                    setSelected(c);
                                    setData((d) => ({
                                        ...d,
                                        items: d.items.map((x) => (x.id === c.id ? c : x)),
                                    }));
                                }}
                            />
                        ) : (
                            <div className="grid h-full place-items-center text-center text-slate-500">
                                <div>
                                    <div className="mb-2 text-4xl">👤</div>
                                    <div className="text-lg font-medium">
                                        Select a contact on the left to view details
                                    </div>
                                    <div className="text-sm">Or create a new contact</div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {/* Detail modal (mobile) */}
            <ContactDetailModal
                open={openDetailMobile}
                contact={selected}
                loading={loadingDetail} // Pass loading state
                onClose={() => {
                    setOpenDetailMobile(false);
                    nav("/contacts");
                }}
                onEdit={() => {
                    setOpenDetailMobile(false);
                    setEditTarget(selected);
                    setOpenEdit(true);
                }}
                onUpdated={(c) => {
                    setSelected(c);
                    setData((d) => ({
                        ...d,
                        items: d.items.map((x) => (x.id === c.id ? c : x)),
                    }));
                }}
            />

            {/* Create / Edit */}
            <EditContactSheet
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                token={token}
                contact={editTarget}                    // null => new, object => edit
                onSaved={(c) => {
                    setOpenEdit(false);
                    setSelected(c);
                    nav(`/contacts/${c.id}`);
                    setData((d) => {
                        const exists = d.items.some((x) => x.id === c.id);
                        return exists
                            ? { ...d, items: d.items.map((x) => (x.id === c.id ? c : x)) }
                            : { ...d, items: [c, ...d.items] };
                    });
                }}
            />

            {/* Import / Export */}
            <ImportContactsModal
                open={openImport}
                onClose={() => setOpenImport(false)}
                token={token}
                onDone={() => {
                    setPage(1); // Reset to page 1
                    setRefreshKey((k) => k + 1); // Trigger list refresh
                }}
            />
            <ExportContactsModal
                open={openExport}
                onClose={() => setOpenExport(false)}
                token={token}
                filters={{ q: qDebounced, sort }}
            />
        </div>
    );
}
