'use client';

import { useState } from 'react';
import { importContacts, downloadContactsTemplate } from '../../services/contacts';

export default function ImportContactsModal({
    open, onClose, token, onDone,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    onDone?: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [matchBy, setMatchBy] = useState<'id' | 'email' | 'phone'>('id');
    const [busy, setBusy] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [tmplFormat, setTmplFormat] = useState<'xlsx' | 'csv'>('xlsx');

    const [summary, setSummary] = useState<any>(null);
    const [err, setErr] = useState<string | null>(null);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Import contacts</h3>
                    <button onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button>
                </div>

                <div className="space-y-3">
                    {/* tải file mẫu qua backend (đúng base API) */}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span>Tải file mẫu:</span>
                        <select
                            value={tmplFormat}
                            onChange={(e) => setTmplFormat(e.target.value as 'xlsx' | 'csv')}
                            className="rounded-md border px-2 py-1"
                        >
                            <option value="xlsx">.xlsx</option>
                            <option value="csv">.csv</option>
                        </select>
                        <button
                            onClick={async () => {
                                setErr(null);
                                setDownloading(true);
                                try {
                                    await downloadContactsTemplate(tmplFormat, token);
                                } catch (e: any) {
                                    setErr(e?.message || 'Download template failed');
                                } finally {
                                    setDownloading(false);
                                }
                            }}
                            className="rounded-md border px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                            disabled={downloading}
                        >
                            {downloading ? 'Đang tải…' : 'Download'}
                        </button>
                    </div>

                    <div>
                        <input
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="text-sm">Match by</label>
                        <select
                            value={matchBy}
                            onChange={(e) => setMatchBy(e.target.value as any)}
                            className="rounded-md border px-2 py-1"
                        >
                            <option value="id">ID</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                        </select>
                    </div>

                    {err && <div className="rounded-md bg-red-50 p-2 text-sm text-red-600">{err}</div>}

                    {summary && (
                        <div className="rounded-md bg-slate-50 p-3 text-sm">
                            <div>Created: <b>{summary?.summary?.created ?? 0}</b></div>
                            <div>Updated: <b>{summary?.summary?.updated ?? 0}</b></div>
                            <div>Skipped: <b>{summary?.summary?.skipped ?? 0}</b></div>
                            {(summary?.summary?.errors || []).length > 0 && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer">Errors</summary>
                                    <ul className="list-disc pl-5">
                                        {summary.summary.errors.map((e: any, i: number) => (
                                            <li key={i}>Row {e.row}: {e.error}</li>
                                        ))}
                                    </ul>
                                </details>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onClose} className="rounded-xl border px-4 py-2">Close</button>
                    <button
                        disabled={!file || busy}
                        onClick={async () => {
                            if (!file) return;
                            setBusy(true); setErr(null);
                            try {
                                const res = await importContacts(file, matchBy, token);
                                setSummary(res);
                                onDone?.();
                            } catch (e: any) {
                                setErr(e?.message || 'Import failed');
                            } finally {
                                setBusy(false);
                            }
                        }}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                    >
                        {busy ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
}
