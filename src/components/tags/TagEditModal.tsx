'use client';

import { useEffect, useState } from 'react';
import { createTag, renameTag, type Tag } from '../../services/tags';

export default function TagEditModal({
    open, onClose, token, tag, onSaved,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    tag?: Tag | null;         // if provided → rename mode; if null → create mode
    onSaved: (t: Tag) => void;
}) {
    const [name, setName] = useState(tag?.name || '');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open) { setName(tag?.name || ''); setErr(null); setBusy(false); }
    }, [open, tag?.id]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{tag ? 'Rename tag' : 'New tag'}</h3>
                    <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                </div>

                <div className="space-y-3">
                    <label className="block text-sm">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300"
                            placeholder="e.g. vip, design, hot"
                        />
                    </label>

                    {err && <div className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded-xl border px-4 py-2">Cancel</button>
                    <button
                        disabled={!name.trim() || busy}
                        onClick={async () => {
                            if (!name.trim()) return;
                            setBusy(true); setErr(null);
                            try {
                                const saved = tag ? await renameTag(tag.id, name.trim(), token)
                                    : await createTag(name.trim(), token);
                                onSaved(saved);
                                onClose();
                            } catch (e: any) {
                                setErr(e?.message || 'Save failed');
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
