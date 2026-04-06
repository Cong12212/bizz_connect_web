import { createWorker } from "tesseract.js";

/**
 * Run OCR on an image file and return the raw extracted text.
 * Progress callback receives 0-100.
 */
export async function ocrImage(
    file: File,
    onProgress?: (pct: number) => void
): Promise<string> {
    const worker = await createWorker("eng", 1, {
        logger: (m) => {
            if (m.status === "recognizing text" && onProgress) {
                onProgress(Math.round(m.progress * 100));
            }
        },
    });

    const url = URL.createObjectURL(file);
    try {
        const { data } = await worker.recognize(url);
        return data.text;
    } finally {
        URL.revokeObjectURL(url);
        await worker.terminate();
    }
}
