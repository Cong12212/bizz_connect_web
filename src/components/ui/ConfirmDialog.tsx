import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Props {
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title = "Confirm",
    message = "Are you sure?",
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    busy = false,
    onConfirm,
    onCancel,
}: Props) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
                <div className="flex flex-col items-center gap-3 p-6 pb-4 text-center">
                    {danger && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                            <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
                        </div>
                    )}
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{message}</p>
                </div>

                <div className="flex gap-2 border-t px-6 py-4">
                    <button
                        onClick={onCancel}
                        disabled={busy}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={busy}
                        className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                            danger
                                ? "bg-rose-600 hover:bg-rose-700"
                                : "bg-slate-900 hover:bg-slate-800"
                        }`}
                    >
                        {busy ? "Processing…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
