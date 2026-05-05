import { useEffect } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export default function ImageLightbox({ src, alt, onClose, downloadName }: {
    src: string;
    alt?: string;
    onClose: () => void;
    downloadName?: string;
}) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    async function handleDownload() {
        try {
            const res = await fetch(src);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = downloadName || "image.jpg";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            window.open(src, "_blank");
        }
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <img
                    src={src}
                    alt={alt}
                    className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                />
                <button
                    onClick={onClose}
                    className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100"
                >
                    <XMarkIcon className="h-5 w-5 text-slate-700" />
                </button>
                {downloadName && (
                    <button
                        onClick={handleDownload}
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-lg hover:bg-slate-100"
                    >
                        <ArrowDownTrayIcon className="h-4 w-4" /> Download
                    </button>
                )}
            </div>
        </div>
    );
}
