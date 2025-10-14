// src/pages/Tags.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import AppNav from '../components/AppNav';
import { useAppSelector } from '../utils/hooks';
import useDebounced from '../hooks/useDebounced';
import {
    listTags,
    createTag,
    renameTag,
    deleteTagApi,
    type Tag,
} from '../services/tags';
import { attachTags, detachTag } from '../services/contacts';
import SelectContactsModal from '../components/contacts/SelectContactsModal';
import { useToast, Spinner } from '../components/ui/Toast';

/* -------------------------------- Types -------------------------------- */
type RemoveModalState = { open: false } | { open: true; tag: Tag };

/* ------------------------------ Main page ------------------------------ */
export default function TagsPage() {
    const toast = useToast();

    const reduxToken = useAppSelector((s) => s.auth.token);
    const token =
        reduxToken ||
        (typeof window !== 'undefined' ? localStorage.getItem('bc_token') || '' : '');

    const [q, setQ] = useState('');
    const qDeb = useDebounced(q, 300);

    const [data, setData] = useState<{ items: Tag[]; total: number; last: number }>({
        items: [],
        total: 0,
        last: 1,
    });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // refresh keys
    const [reloadKey, setReloadKey] = useState(0);
    const [modalReloadKey, setModalReloadKey] = useState(0);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState<{ open: false } | { open: true; tag: Tag }>({ open: false });
    const [deleteOpen, setDeleteOpen] = useState<{ open: false } | { open: true; tag: Tag }>({ open: false });
    const [removeModal, setRemoveModal] = useState<RemoveModalState>({ open: false });

    useEffect(() => {
        let active = true;
        setLoading(true);
        setErr(null);
        listTags({ q: qDeb, page }, token)
            .then((res) => {
                if (!active) return;
                setData({ items: res.data, total: res.total, last: res.last_page });
            })
            .catch((e) => setErr(e?.message || 'Failed to load tags'))
            .finally(() => setLoading(false));
        return () => {
            active = false;
        };
    }, [qDeb, page, token, reloadKey]);

    const activeRemoveTag = useMemo(
        () => (removeModal.open ? removeModal.tag : null),
        [removeModal]
    );

    function bumpTagCount(tagId: number, delta: number) {
        setData((d) => ({
            ...d,
            items: d.items.map((t) =>
                t.id === tagId
                    ? { ...t, contacts_count: Math.max(0, (t.contacts_count || 0) + delta) }
                    : t
            ),
        }));
    }

    return (
        <div className="h-[100svh] overflow-hidden bg-slate-50 text-slate-900">
            <div className="sticky top-0 z-40 md:hidden">
                <AppNav variant="mobile" />
            </div>
            <AppNav variant="sidebar" />

            <main className="md:ml-64 h-screen overflow-hidden p-4">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-3 flex items-center gap-3">
                        <h1 className="text-lg font-semibold">Tags</h1>

                        <div className="relative w-[min(420px,70vw)]">
                            <input
                                value={q}
                                onChange={(e) => {
                                    setPage(1);
                                    setQ(e.target.value);
                                }}
                                placeholder="Search tags..."
                                className="w-full rounded-xl border bg-white px-4 py-2 pl-10 outline-none focus:ring-2 focus:ring-slate-300"
                            />
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                🔎
                            </span>
                        </div>

                        <button
                            onClick={() => setCreateOpen(true)}
                            className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                        >
                            New tag
                        </button>
                    </div>

                    {err && <div className="mb-2 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>}

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border bg-white">
                        <div className="grid grid-cols-[1fr_120px_200px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                            <div>Name</div>
                            <div>Contacts</div>
                            <div>Actions</div>
                        </div>

                        {loading ? (
                            <div className="p-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="mb-2 h-10 animate-pulse rounded-lg bg-slate-200" />
                                ))}
                            </div>
                        ) : data.items.length ? (
                            <ul>
                                {data.items.map((t) => (
                                    <li
                                        key={t.id}
                                        className="grid grid-cols-[1fr_120px_200px] items-center gap-2 px-3 py-2"
                                    >
                                        <div className="truncate">#{t.name}</div>
                                        <div>
                                            <button
                                                className="inline-flex min-w-[40px] items-center justify-center rounded-md border px-2 py-0.5 text-sm hover:bg-slate-50"
                                                title="View & add/remove contacts for this tag"
                                                onClick={() => setRemoveModal({ open: true, tag: t })}
                                            >
                                                {t.contacts_count ?? 0}
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
                                                onClick={() => setRenameOpen({ open: true, tag: t })}
                                            >
                                                Rename
                                            </button>
                                            <button
                                                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-sm text-rose-700 hover:bg-rose-100"
                                                onClick={() => setDeleteOpen({ open: true, tag: t })}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500">No tags found</div>
                        )}

                        {/* Pager */}
                        <div className="flex items-center justify-end gap-2 border-t p-2 text-xs">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="rounded-md border px-2 py-1 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <span>
                                Page {page} / {Math.max(1, data.last)}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(data.last || 1, p + 1))}
                                disabled={page >= data.last}
                                className="rounded-md border px-2 py-1 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Tag */}
            <CreateTagModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={async (name) => {
                    try {
                        const created = await createTag(name.trim(), token);
                        setData((d) => ({
                            ...d,
                            items: [{ ...created, contacts_count: created.contacts_count ?? 0 }, ...d.items],
                            total: d.total + 1,
                        }));
                        setReloadKey((k) => k + 1);
                        toast.success('Tag created.');
                        setCreateOpen(false);
                    } catch (e: any) {
                        toast.error(e?.response?.data?.message || e?.message || 'Create tag failed.');
                    }
                }}
            />

            {/* Rename Tag */}
            {renameOpen.open && (
                <RenameTagModal
                    open
                    tag={renameOpen.tag}
                    onClose={() => setRenameOpen({ open: false })}
                    onSubmit={async (newName) => {
                        try {
                            await renameTag(renameOpen.tag.id, newName.trim(), token);
                            setReloadKey((k) => k + 1);
                            toast.success('Tag renamed.');
                            setRenameOpen({ open: false });
                        } catch (e: any) {
                            toast.error(e?.response?.data?.message || e?.message || 'Rename tag failed.');
                        }
                    }}
                />
            )}

            {/* Delete Tag */}
            {deleteOpen.open && (
                <ConfirmDeleteModal
                    open
                    tag={deleteOpen.tag}
                    onClose={() => setDeleteOpen({ open: false })}
                    onConfirm={async () => {
                        try {
                            await deleteTagApi(deleteOpen.tag.id, token);
                            setData((d) => ({
                                ...d,
                                items: d.items.filter((x) => x.id !== deleteOpen.tag.id),
                                total: Math.max(0, d.total - 1),
                            }));
                            setReloadKey((k) => k + 1);
                            toast.success('Tag deleted.');
                            setDeleteOpen({ open: false });
                        } catch (e: any) {
                            toast.error(e?.response?.data?.message || e?.message || 'Delete tag failed.');
                        }
                    }}
                />
            )}

            {/* View contacts of a tag: remove/add here */}
            {activeRemoveTag && (
                <SelectContactsModal
                    open={true}
                    onClose={() => setRemoveModal({ open: false })}
                    token={token}
                    filters={{ tags: [activeRemoveTag.name], tag_mode: 'all', sort: 'name' }}
                    title={`Contacts with #${activeRemoveTag.name}`}
                    confirmLabel="Remove tag from selected"
                    onConfirm={async (ids) => {
                        await Promise.all(ids.map((id) => detachTag(id, activeRemoveTag.id, token)));
                        bumpTagCount(activeRemoveTag.id, -ids.length);
                        setModalReloadKey((k) => k + 1);
                        setReloadKey((k) => k + 1);
                        toast.success('Tag removed from selected contacts.');
                    }}
                    allowToggleWithWithout
                    focusTag={activeRemoveTag}
                    onAddToFocusTag={async (ids, tag) => {
                        await Promise.all(ids.map((id) => attachTags(id, { names: [tag.name] }, token)));
                        bumpTagCount(tag.id, +ids.length);
                        setModalReloadKey((k) => k + 1);
                        setReloadKey((k) => k + 1);
                        toast.success('Tag added to selected contacts.');
                    }}
                    canAddTags
                    onAddTags={async (ids, names) => {
                        await Promise.all(ids.map((id) => attachTags(id, { names }, token)));
                        setModalReloadKey((k) => k + 1);
                        setReloadKey((k) => k + 1);
                        toast.success('Tags added.');
                    }}
                    refreshKey={modalReloadKey}
                />
            )}
        </div>
    );
}

/* ------------------------------ UI helpers ----------------------------- */

function ModalShell({
    open,
    title,
    onClose,
    children,
    footer,
}: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <h3 className="text-base font-semibold">{title}</h3>
                        <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100">✕</button>
                    </div>
                    <div className="p-4">{children}</div>
                    {footer && <div className="flex items-center justify-end gap-2 border-t bg-white p-3">{footer}</div>}
                </div>
            </div>
        </div>
    );
}

function CreateTagModal({
    open,
    onClose,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string) => Promise<void> | void;
}) {
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);

    return (
        <ModalShell
            open={open}
            title="Create tag"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button onClick={onClose} className="rounded-xl border px-4 py-2">Cancel</button>
                    <button
                        disabled={!name.trim() || busy}
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await onSubmit(name);
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                        {busy && <Spinner />}Create
                    </button>
                </>
            }
        >
            <label className="block text-sm">
                <div className="mb-1 text-slate-600">Name</div>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. vip, partner, warm"
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                />
            </label>
        </ModalShell>
    );
}

function RenameTagModal({
    open,
    tag,
    onClose,
    onSubmit,
}: {
    open: boolean;
    tag: Tag;
    onClose: () => void;
    onSubmit: (newName: string) => Promise<void> | void;
}) {
    const [name, setName] = useState(tag.name);
    const [busy, setBusy] = useState(false);

    return (
        <ModalShell
            open={open}
            title={`Rename #${tag.name}`}
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button onClick={onClose} className="rounded-xl border px-4 py-2">Cancel</button>
                    <button
                        disabled={!name.trim() || name.trim() === tag.name || busy}
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await onSubmit(name);
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
                    >
                        {busy && <Spinner />}Save
                    </button>
                </>
            }
        >
            <label className="block text-sm">
                <div className="mb-1 text-slate-600">New name</div>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                />
            </label>
        </ModalShell>
    );
}

function ConfirmDeleteModal({
    open,
    tag,
    onClose,
    onConfirm,
}: {
    open: boolean;
    tag: Tag;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
}) {
    const [busy, setBusy] = useState(false);
    return (
        <ModalShell
            open={open}
            title="Delete tag"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button onClick={onClose} className="rounded-xl border px-4 py-2">Cancel</button>
                    <button
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await onConfirm();
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                        disabled={busy}
                    >
                        {busy && <Spinner />}Delete
                    </button>
                </>
            }
        >
            <p className="text-sm text-slate-600">
                Are you sure you want to delete tag <b>#{tag.name}</b>? This action cannot be undone.
            </p>
        </ModalShell>
    );
}
