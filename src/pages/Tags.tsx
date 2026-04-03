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
    attachContactsToTag,
    detachContactsFromTag,
    type Tag,
} from '../services/tags';
import SelectContactsModal from '../components/contacts/SelectContactsModal';
import { useToast, Spinner } from '../components/ui/Toast';
import {
    Search,
    Hash,
    Plus,
    Edit2,
    Trash2,
    Users,
    X,
    Check,
    Tag as TagIcon,
} from 'lucide-react';

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
            .catch((e) => {
                if (!active) return;
                setErr(e?.message || 'Failed to load tags');
                toast.error(e?.message || 'Failed to load tags');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [qDeb, page, token, reloadKey]);

    const activeRemoveTag = useMemo(
        () => (removeModal.open ? removeModal.tag : null),
        [removeModal]
    );

    function syncTagCount(tagId: number, contacts_count: number) {
        setData((d) => ({
            ...d,
            items: d.items.map((t) =>
                t.id === tagId ? { ...t, contacts_count } : t
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
                <div className="mx-auto max-w-5xl">
                    {/* Header */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold">Tags</h1>
                            <p className="text-sm text-slate-600">
                                {data.total} total
                            </p>
                        </div>

                        <button
                            onClick={() => setCreateOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                        >
                            <Plus className="h-4 w-4" />
                            New Tag
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-3 relative max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={q}
                            onChange={(e) => {
                                setPage(1);
                                setQ(e.target.value);
                            }}
                            placeholder="Search tags..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm outline-none transition-all focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                        />
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                        <div className="grid grid-cols-[1fr_140px_220px] items-center gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
                            <div>Tag Name</div>
                            <div>Contacts</div>
                            <div>Actions</div>
                        </div>

                        {loading ? (
                            <div className="p-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="mb-2 h-12 animate-pulse rounded-lg bg-slate-200" />
                                ))}
                            </div>
                        ) : data.items.length ? (
                            <ul className="divide-y divide-slate-100">
                                {data.items.map((t) => (
                                    <li
                                        key={t.id}
                                        className="grid grid-cols-[1fr_140px_220px] items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                                <Hash className="h-4 w-4" />
                                            </div>
                                            <span className="truncate font-medium">{t.name}</span>
                                        </div>

                                        <div>
                                            <button
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                                                title="View & manage contacts for this tag"
                                                onClick={() => setRemoveModal({ open: true, tag: t })}
                                            >
                                                <Users className="h-3.5 w-3.5" />
                                                {t.contacts_count ?? 0}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:bg-slate-50"
                                                onClick={() => setRenameOpen({ open: true, tag: t })}
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Rename
                                            </button>
                                            <button
                                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition-all hover:bg-rose-100"
                                                onClick={() => setDeleteOpen({ open: true, tag: t })}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center">
                                <TagIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                <div className="text-sm font-medium text-slate-900">No tags found</div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {q ? 'Try another search term' : 'Create your first tag to get started'}
                                </div>
                            </div>
                        )}

                        {/* Pager */}
                        {data.last > 1 && (
                            <div className="flex items-center justify-between border-t bg-slate-50 px-4 py-3">
                                <div className="text-sm text-slate-600">
                                    Page {page} of {data.last}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page <= 1}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(data.last || 1, p + 1))}
                                        disabled={page >= data.last}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
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
                        const updated = await detachContactsFromTag(activeRemoveTag.id, ids, token);
                        syncTagCount(activeRemoveTag.id, updated.contacts_count ?? 0);
                        setModalReloadKey((k) => k + 1);
                        toast.success('Tag removed from selected contacts.');
                    }}
                    allowToggleWithWithout
                    focusTag={activeRemoveTag}
                    onAddToFocusTag={async (ids, tag) => {
                        const updated = await attachContactsToTag(tag.id, ids, token);
                        syncTagCount(tag.id, updated.contacts_count ?? 0);
                        setModalReloadKey((k) => k + 1);
                        toast.success('Tag added to selected contacts.');
                    }}
                    canAddTags
                    onAddTags={async (ids, names) => {
                        // Attach each named tag to contacts in bulk (still need per-tag calls, but 1 call per tag not per contact)
                        await Promise.all(
                            names.map(async (name) => {
                                const tag = data.items.find((t) => t.name === name);
                                if (tag) {
                                    const updated = await attachContactsToTag(tag.id, ids, token);
                                    syncTagCount(tag.id, updated.contacts_count ?? 0);
                                }
                            })
                        );
                        setModalReloadKey((k) => k + 1);
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
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
                        <h3 className="text-base font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="p-4">{children}</div>
                    {footer && <div className="flex items-center justify-end gap-2 border-t bg-slate-50 p-4">{footer}</div>}
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
            title="Create Tag"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
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
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {busy ? <Spinner /> : <Plus className="h-4 w-4" />}
                        Create
                    </button>
                </>
            }
        >
            <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">Tag Name</div>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. vip, partner, warm"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim() && !busy) {
                            e.preventDefault();
                            (async () => {
                                setBusy(true);
                                try {
                                    await onSubmit(name);
                                } finally {
                                    setBusy(false);
                                }
                            })();
                        }
                    }}
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
            title={`Rename Tag`}
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
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
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {busy ? <Spinner /> : <Check className="h-4 w-4" />}
                        Save
                    </button>
                </>
            }
        >
            <div className="mb-3 rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500 mb-1">Current name</div>
                <div className="font-medium">#{tag.name}</div>
            </div>
            <label className="block">
                <div className="mb-2 text-sm font-medium text-slate-700">New Name</div>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim() && name.trim() !== tag.name && !busy) {
                            e.preventDefault();
                            (async () => {
                                setBusy(true);
                                try {
                                    await onSubmit(name);
                                } finally {
                                    setBusy(false);
                                }
                            })();
                        }
                    }}
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
            title="Delete Tag"
            onClose={busy ? () => { } : onClose}
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            setBusy(true);
                            try {
                                await onConfirm();
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={busy}
                    >
                        {busy ? <Spinner /> : <Trash2 className="h-4 w-4" />}
                        Delete
                    </button>
                </>
            }
        >
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
                <p className="text-sm text-rose-900">
                    Are you sure you want to delete tag <span className="font-semibold">#{tag.name}</span>?
                    This action cannot be undone.
                </p>
            </div>
        </ModalShell>
    );
}
