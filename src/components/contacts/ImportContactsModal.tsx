// src/components/contacts/ImportContactsModal.tsx
'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { importContacts, downloadContactsTemplate } from '../../services/contacts';
import { Spinner, useToast } from '../ui/Toast';

export default function ImportContactsModal({
    open,
    onClose,
    token,
    onDone,
}: {
    open: boolean;
    onClose: () => void;
    token: string;
    onDone?: () => void;
}) {
    const toast = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [matchBy, setMatchBy] = useState<'id' | 'email' | 'phone'>('id');
    const [busy, setBusy] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [tmplFormat, setTmplFormat] = useState<'xlsx' | 'csv'>('xlsx');

    const [summary, setSummary] = useState<any>(null);
    const [dragOver, setDragOver] = useState(false);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const prettySize = useMemo(() => {
        if (!file) return '';
        const kb = file.size / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(2)} MB`;
    }, [file]);

    const onPickClick = () => inputRef.current?.click();

    const onFilePicked = (f: File | null) => {
        if (!f) return;
        const ok = /\.xlsx$|\.csv$/i.test(f.name);
        if (!ok) {
            toast.error('Please choose .xlsx or .csv file.');
            return;
        }
        setFile(f);
        setSummary(null);
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) onFilePicked(f);
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={busy ? undefined : onClose} />

            {/* container */}
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
                <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
                    {/* Header */}
                    <div className="relative">
                        <div className="h-20 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700" />
                        <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6">
                            <div className="flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow ring-1 ring-black/5">
                                <h3 className="text-base font-semibold text-slate-900">Import contacts</h3>
                                <button
                                    onClick={onClose}
                                    className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="mt-8 grid gap-4 px-4 pb-4 pt-2 sm:px-6">
                        {/* template row */}
                        <div className="flex flex-col items-start justify-between gap-2 rounded-xl border bg-slate-50/70 p-3 sm:flex-row sm:items-center">
                            <div className="text-sm text-slate-600">
                                Download template file to prepare your contacts.
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={tmplFormat}
                                    onChange={(e) => setTmplFormat(e.target.value as 'xlsx' | 'csv')}
                                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                                >
                                    <option value="xlsx">.xlsx</option>
                                    <option value="csv">.csv</option>
                                </select>
                                <button
                                    onClick={async () => {
                                        setDownloading(true);
                                        try {
                                            await downloadContactsTemplate(tmplFormat, token);
                                            toast.success('Template downloaded.');
                                        } catch (e: any) {
                                            toast.error(e?.message || 'Download template failed');
                                        } finally {
                                            setDownloading(false);
                                        }
                                    }}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                    disabled={downloading}
                                >
                                    {downloading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Spinner /> Downloading…
                                        </span>
                                    ) : (
                                        'Download'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* drag & drop */}
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            className={[
                                'relative grid place-items-center rounded-2xl border-2 border-dashed p-6 transition',
                                dragOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-300 bg-white',
                            ].join(' ')}
                        >
                            <div className="text-center">
                                <div className="mb-2 text-4xl">📄</div>
                                <div className="text-sm text-slate-600">
                                    Drag & drop your <b>.xlsx</b> or <b>.csv</b> here,
                                    <br /> or{' '}
                                    <button
                                        onClick={onPickClick}
                                        className="font-semibold text-indigo-600 hover:underline"
                                        type="button"
                                    >
                                        browse to choose
                                    </button>
                                    .
                                </div>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".xlsx,.csv"
                                    className="hidden"
                                    onChange={(e) => onFilePicked(e.target.files?.[0] || null)}
                                />
                            </div>

                            {/* chosen file badge */}
                            {file && (
                                <div className="absolute inset-x-3 bottom-3 mx-auto max-w-full">
                                    <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow">
                                        <span className="truncate">{file.name}</span>
                                        <span className="opacity-80">• {prettySize}</span>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                setSummary(null);
                                            }}
                                            className="rounded px-1 hover:bg-white/20"
                                            title="Clear"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* options */}
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="text-sm text-slate-600">Match existing by</label>
                            <select
                                value={matchBy}
                                onChange={(e) => setMatchBy(e.target.value as any)}
                                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                            >
                                <option value="id">ID</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                            </select>

                            <span className="text-xs text-slate-500">
                                (If a record matches, it will be updated; otherwise it will be created.)
                            </span>
                        </div>

                        {/* summary */}
                        {summary && (
                            <div className="rounded-2xl border bg-white p-4">
                                <div className="mb-2 text-sm font-semibold">Result</div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <Stat label="Created" value={summary?.summary?.created ?? 0} />
                                    <Stat label="Updated" value={summary?.summary?.updated ?? 0} />
                                    <Stat label="Skipped" value={summary?.summary?.skipped ?? 0} />
                                </div>

                                {(summary?.summary?.errors || []).length > 0 && (
                                    <div className="mt-3">
                                        <details className="rounded-lg bg-rose-50/60 p-3 text-sm text-rose-700">
                                            <summary className="cursor-pointer font-medium">
                                                Errors ({summary.summary.errors.length})
                                            </summary>
                                            <ul className="mt-2 list-disc space-y-1 pl-5">
                                                {summary.summary.errors.map((e: any, i: number) => (
                                                    <li key={i}>
                                                        Row <b>{e.row}</b>: {e.error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div
                        className="flex flex-col-reverse items-stretch gap-2 border-t bg-white p-3 sm:flex-row sm:items-center sm:justify-end sm:px-6"
                        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                    >
                        <button
                            onClick={onClose}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium hover:bg-slate-50"
                        >
                            Close
                        </button>
                        <button
                            disabled={!file || busy}
                            onClick={async () => {
                                if (!file) return;
                                setBusy(true);
                                try {
                                    const res = await importContacts(file, matchBy, token);
                                    setSummary(res);
                                    toast.success('Import completed.');
                                    onDone?.();
                                } catch (e: any) {
                                    toast.error(e?.message || 'Import failed');
                                } finally {
                                    setBusy(false);
                                }
                            }}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {busy ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner /> Importing…
                                </span>
                            ) : (
                                'Import'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border bg-slate-50 p-3 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-lg font-semibold text-slate-800">{value}</div>
        </div>
    );
}
