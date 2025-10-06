// src/components/contacts/ContactTagManager.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { attachTags, detachTag, type Contact } from '../../services/contacts';
import { listTags, type Tag } from '../../services/tags';

type Props = {
    contact: Contact;
    token: string;
    onUpdated: (c: Contact) => void;
};

export default function ContactTagManager({ contact, token, onUpdated }: Props) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [options, setOptions] = useState<Tag[]>([]);
    const panelRef = useRef<HTMLDivElement | null>(null);

    const currentIds = useMemo(() => new Set((contact.tags || []).map(t => t.id)), [contact.tags]);

    // click outside -> close
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (!open) return;
            if (panelRef.current && !panelRef.current.contains(e.target as any)) setOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    // search tags
    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await listTags(q.trim(), token);
                if (!active) return;
                setOptions(res.data);
            } catch (e: any) {
                // ignore
            }
        })();
        return () => { active = false; };
    }, [q, token]);

    async function addById(id: number) {
        if (currentIds.has(id)) return;
        setBusy(true); setErr(null);
        try {
            const updated = await attachTags(contact.id, { ids: [id] }, token);
            onUpdated(updated);
            setQ('');
        } catch (e: any) {
            setErr(e?.message || 'Failed to attach tag');
        } finally {
            setBusy(false);
        }
    }

    async function createAndAttach(name: string) {
        setBusy(true); setErr(null);
        try {
            const updated = await attachTags(contact.id, { names: [name] }, token);
            onUpdated(updated);
            setQ('');
        } catch (e: any) {
            setErr(e?.message || 'Failed to create tag');
        } finally {
            setBusy(false);
        }
    }

    async function remove(tagId: number) {
        setBusy(true); setErr(null);
        try {
            const updated = await detachTag(contact.id, tagId, token);
            onUpdated(updated);
        } catch (e: any) {
            setErr(e?.message || 'Failed to remove tag');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="rounded-full border px-3 py-1 text-xs font-medium hover:bg-slate-50"
            >
                + Tag
            </button>

            {open && (
                <div className="absolute z-50 mt-2 w-72 rounded-xl border bg-white p-3 shadow-xl">
                    <div className="mb-2 text-sm font-medium">Manage tags</div>

                    {/* current tags */}
                    <div className="mb-2 flex flex-wrap gap-1.5">
                        {(contact.tags || []).length ? (
                            contact.tags!.map(t => (
                                <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs ring-1 ring-slate-200">
                                    {t.name}
                                    <button
                                        className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200"
                                        onClick={() => remove(t.id)}
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-500">No tags</span>
                        )}
                    </div>

                    {/* search / create */}
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search or create a tag…"
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-slate-300"
                    />

                    {/* suggestions */}
                    <div className="mt-2 max-h-48 overflow-auto rounded-lg border bg-white">
                        {options
                            .filter(o => !currentIds.has(o.id))
                            .map(o => (
                                <button
                                    key={o.id}
                                    onClick={() => addById(o.id)}
                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                                >
                                    #{o.name}
                                </button>
                            ))}

                        {/* create new */}
                        {q.trim() && !options.some(o => o.name.toLowerCase() === q.trim().toLowerCase()) && (
                            <button
                                onClick={() => createAndAttach(q.trim())}
                                className="block w-full text-left px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                            >
                                + Create “{q.trim()}”
                            </button>
                        )}
                    </div>

                    {err && <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-600">{err}</div>}
                    {busy && <div className="mt-2 text-xs text-slate-500">Working…</div>}
                </div>
            )}
        </div>
    );
}
