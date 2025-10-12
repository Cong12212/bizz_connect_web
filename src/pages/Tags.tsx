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

type RemoveModalState = { open: false } | { open: true; tag: Tag };

export default function TagsPage() {
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

    // refresh key để re-fetch nền khi cần
    const [reloadKey, setReloadKey] = useState(0);
    // key riêng cho modal để ép refetch ngay trong modal
    const [modalReloadKey, setModalReloadKey] = useState(0);

    // Modals
    const [addModalOpen, setAddModalOpen] = useState(false);
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
            .catch((e) => setErr(e?.message || 'Failed to load'))
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
                            onClick={async () => {
                                const name = prompt('New tag name?');
                                const trimmed = (name || '').trim();
                                if (!trimmed) return;
                                try {
                                    const created = await createTag(trimmed, token);
                                    // ✅ Không đổi q; cập nhật giao diện ngay
                                    setData((d) => ({
                                        ...d,
                                        items: [{ ...created, contacts_count: created.contacts_count ?? 0 }, ...d.items],
                                        total: d.total + 1,
                                    }));
                                    setReloadKey((k) => k + 1); // sync nền
                                } catch (e: any) {
                                    alert(e?.message || 'Create failed');
                                }
                            }}
                            className="ml-auto rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                        >
                            New tag
                        </button>
                    </div>

                    {err && <div className="mb-2 rounded-md bg-rose-50 p-2 text-rose-700">{err}</div>}

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border bg-white">
                        <div className="grid grid-cols-[1fr_120px_160px] border-b bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
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
                                        className="grid grid-cols-[1fr_120px_160px] items-center gap-2 px-3 py-2"
                                    >
                                        <div className="truncate">#{t.name}</div>
                                        <div>
                                            <button
                                                className="inline-flex min-w-[40px] items-center justify-center rounded-md border px-2 py-0.5 text-sm hover:bg-slate-50"
                                                title="View & remove/add for this tag"
                                                onClick={() => setRemoveModal({ open: true, tag: t })}
                                            >
                                                {t.contacts_count ?? 0}
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="rounded-md border px-2 py-1 text-sm hover:bg-slate-50"
                                                onClick={async () => {
                                                    const name = prompt('Rename tag', t.name);
                                                    if (!name || name.trim() === t.name) return;
                                                    try {
                                                        await renameTag(t.id, name.trim(), token);
                                                        setReloadKey((k) => k + 1);
                                                    } catch (e: any) {
                                                        alert(e?.message || 'Rename failed');
                                                    }
                                                }}
                                            >
                                                Rename
                                            </button>
                                            <button
                                                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-sm text-rose-700 hover:bg-rose-100"
                                                onClick={async () => {
                                                    if (!confirm(`Delete tag "${t.name}"?`)) return;
                                                    try {
                                                        await deleteTagApi(t.id, token);
                                                        // ✅ Optimistic remove
                                                        setData((d) => ({
                                                            ...d,
                                                            items: d.items.filter((x) => x.id !== t.id),
                                                            total: Math.max(0, d.total - 1),
                                                        }));
                                                        setReloadKey((k) => k + 1);
                                                    } catch (e: any) {
                                                        alert(e?.message || 'Delete failed');
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-500">No tags</div>
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

            {/* Bulk ADD tag (chỉ add) */}
            <SelectContactsModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                token={token}
                filters={{ q: '', sort: 'name' }}
                title="Add tag(s) to selected contacts"
                canAddTags
                onAddTags={async (ids, names) => {
                    await Promise.all(ids.map((id) => attachTags(id, { names }, token)));
                    alert(`Added ${names.map((n) => `#${n}`).join(', ')} to ${ids.length} contacts`);
                    setAddModalOpen(false);
                    setReloadKey((k) => k + 1);
                }}
            />

            {/* View contacts of a tag: remove hoặc add ngay tại đây */}
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
                        bumpTagCount(activeRemoveTag.id, -ids.length); // cập nhật ngay
                        setModalReloadKey((k) => k + 1);               // 🔁 refresh trong modal
                        setReloadKey((k) => k + 1);                    // sync bảng ngoài
                    }}
                    allowToggleWithWithout
                    focusTag={activeRemoveTag}
                    onAddToFocusTag={async (ids, tag) => {
                        // đang ở tab WITHOUT → add vào #tag
                        await Promise.all(ids.map((id) => attachTags(id, { names: [tag.name] }, token)));
                        bumpTagCount(tag.id, +ids.length);
                        setModalReloadKey((k) => k + 1);
                        setReloadKey((k) => k + 1);
                    }}
                    canAddTags
                    onAddTags={async (ids, names) => {
                        await Promise.all(ids.map((id) => attachTags(id, { names }, token)));
                        setModalReloadKey((k) => k + 1);
                        setReloadKey((k) => k + 1);
                    }}
                    // 👇 ép modal refetch khi có thay đổi
                    refreshKey={modalReloadKey}
                />
            )}
        </div>
    );
}
