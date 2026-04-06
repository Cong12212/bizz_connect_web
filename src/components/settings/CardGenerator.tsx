import { useEffect, useRef, useState } from "react";
import type { BusinessCard } from "@/services/businessCard";
import type { Company } from "@/services/company";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// Standard business card: 1050 x 600px (3.5" x 2" @ 300dpi)
const W = 1050;
const H = 600;

interface Props {
    card: BusinessCard;
    company: Company | null;
}

export default function CardGenerator({ card, company }: Props) {
    const frontRef = useRef<HTMLCanvasElement>(null);
    const backRef = useRef<HTMLCanvasElement>(null);
    const [generating, setGenerating] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => { renderBoth(); }, [card, company]);

    async function loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async function renderBoth() {
        setGenerating(true);
        setDone(false);
        await Promise.all([renderFront(), renderBack()]);
        setGenerating(false);
        setDone(true);
    }

    // ── FRONT: background image + name/contact overlay ──
    async function renderFront() {
        const canvas = frontRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        canvas.width = W;
        canvas.height = H;

        // Background
        const bgSrc = card.background_image || card.card_image_front;
        if (bgSrc) {
            try {
                const bg = await loadImage(bgSrc);
                coverDraw(ctx, bg, 0, 0, W, H);
            } catch { drawGradientBg(ctx); }
        } else {
            drawGradientBg(ctx);
        }

        // Overlay
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(0,0,0,0.04)");
        grad.addColorStop(0.45, "rgba(0,0,0,0.08)");
        grad.addColorStop(1, "rgba(0,0,0,0.68)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Company logo top-left
        if (company?.logo) {
            try {
                const logo = await loadImage(company.logo);
                const lh = 58;
                const lw = logo.width * (lh / logo.height);
                ctx.drawImage(logo, 48, 38, lw, lh);
            } catch { /* skip */ }
        }

        // Avatar circle bottom-left
        const avSize = 88;
        const avX = 52, avY = H - avSize - 58;
        if (card.avatar) {
            try {
                const av = await loadImage(card.avatar);
                ctx.save();
                ctx.beginPath();
                ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
                ctx.clip();
                ctx.drawImage(av, avX, avY, avSize, avSize);
                ctx.restore();
                ctx.beginPath();
                ctx.arc(avX + avSize / 2, avY + avSize / 2, avSize / 2, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255,255,255,0.7)";
                ctx.lineWidth = 3;
                ctx.stroke();
            } catch { /* skip */ }
        }

        // Name + title bottom
        const textX = card.avatar ? avX + avSize + 20 : 52;
        const nameY = H - 118;
        ctx.shadowColor = "rgba(0,0,0,0.7)";
        ctx.shadowBlur = 10;

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold 52px 'Segoe UI', Arial, sans-serif`;
        ctx.fillText(truncate(ctx, card.full_name || "", W - textX - 260), textX, nameY);

        if (card.job_title) {
            ctx.fillStyle = "rgba(255,255,255,0.80)";
            ctx.font = `28px 'Segoe UI', Arial, sans-serif`;
            ctx.fillText(truncate(ctx, card.job_title, W - textX - 260), textX, nameY + 42);
        }
        ctx.shadowBlur = 0;

        // Contact pills top-right
        const infoItems: string[] = [];
        if (card.email) infoItems.push(`✉  ${card.email}`);
        if (card.phone) infoItems.push(`📞  ${card.phone}`);
        if (card.mobile && card.mobile !== card.phone) infoItems.push(`📱  ${card.mobile}`);
        if (card.website) infoItems.push(`🌐  ${card.website.replace(/^https?:\/\//, "")}`);

        const pillFontSize = 21;
        const pillH = 36, pillGap = 10, pillPadX = 18;
        ctx.font = `${pillFontSize}px 'Segoe UI', Arial, sans-serif`;
        infoItems.forEach((item, i) => {
            const tw = ctx.measureText(item).width;
            const pw = tw + pillPadX * 2;
            const py = 44 + i * (pillH + pillGap);
            const px = W - 44 - pw;
            ctx.fillStyle = "rgba(0,0,0,0.38)";
            roundRect(ctx, px, py, pw, pillH, pillH / 2); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.22)";
            ctx.lineWidth = 1;
            roundRect(ctx, px, py, pw, pillH, pillH / 2); ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.93)";
            ctx.fillText(item, px + pillPadX, py + pillH / 2 + pillFontSize / 2 - 3);
        });
    }

    // ── BACK: clean info card ──
    async function renderBack() {
        const canvas = backRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        canvas.width = W;
        canvas.height = H;

        // Background: soft blurred version of bg image or gradient
        const bgSrc = card.background_image || card.card_image_back;
        if (bgSrc) {
            try {
                const bg = await loadImage(bgSrc);
                ctx.filter = "blur(32px) brightness(0.45) saturate(0.6)";
                coverDraw(ctx, bg, -40, -40, W + 80, H + 80);
                ctx.filter = "none";
            } catch { drawGradientBg(ctx); }
        } else {
            drawGradientBg(ctx);
        }

        // Frosted panel in center
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        roundRect(ctx, 60, 50, W - 120, H - 100, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.18)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, 60, 50, W - 120, H - 100, 24);
        ctx.stroke();

        // Logo centered top
        let logoH = 0;
        if (company?.logo) {
            try {
                const logo = await loadImage(company.logo);
                const lh = 70;
                const lw = logo.width * (lh / logo.height);
                ctx.drawImage(logo, (W - lw) / 2, 80, lw, lh);
                logoH = lh + 20;
            } catch { /* skip */ }
        }

        // Company name
        const topY = 80 + logoH;
        if (company?.name) {
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.font = `bold 32px 'Segoe UI', Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText(company.name, W / 2, topY + 36);
        }

        // Divider
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(200, topY + 60);
        ctx.lineTo(W - 200, topY + 60);
        ctx.stroke();

        // Contact info list
        const contactItems: { icon: string; text: string }[] = [];
        if (card.email) contactItems.push({ icon: "✉", text: card.email });
        if (card.phone) contactItems.push({ icon: "📞", text: card.phone });
        if (card.mobile && card.mobile !== card.phone) contactItems.push({ icon: "📱", text: card.mobile });
        if (card.website) contactItems.push({ icon: "🌐", text: card.website.replace(/^https?:\/\//, "") });
        if (card.linkedin) contactItems.push({ icon: "in", text: card.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "linkedin.com/in/") });

        const listFontSize = 26;
        const lineH = 46;
        const totalH = contactItems.length * lineH;
        let itemY = topY + 80 + (H - topY - 80 - 60 - totalH) / 2;

        contactItems.forEach(({ icon, text }) => {
            ctx.textAlign = "left";
            // Icon
            ctx.font = `${listFontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,0.65)";
            ctx.fillText(icon, 160, itemY);
            // Text
            ctx.fillStyle = "rgba(255,255,255,0.92)";
            ctx.font = `${listFontSize}px 'Segoe UI', Arial, sans-serif`;
            ctx.fillText(truncate(ctx, text, W - 340), 220, itemY);
            itemY += lineH;
        });

        // Reset
        ctx.textAlign = "left";
    }

    function download(ref: React.RefObject<HTMLCanvasElement | null>, side: string) {
        const canvas = ref.current;
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `business-card-${side}-${(card.full_name || "card").replace(/\s+/g, "-").toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }

    return (
        <div className="space-y-4">
            {/* Front */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Front</p>
                <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10" style={{ aspectRatio: "1.586" }}>
                    <canvas ref={frontRef} className="h-full w-full" />
                    {generating && <LoadingOverlay />}
                </div>
                {done && (
                    <button onClick={() => download(frontRef, "front")}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        <ArrowDownTrayIcon className="h-4 w-4" /> Download Front
                    </button>
                )}
            </div>

            {/* Back */}
            <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Back</p>
                <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10" style={{ aspectRatio: "1.586" }}>
                    <canvas ref={backRef} className="h-full w-full" />
                    {generating && <LoadingOverlay />}
                </div>
                {done && (
                    <button onClick={() => download(backRef, "back")}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        <ArrowDownTrayIcon className="h-4 w-4" /> Download Back
                    </button>
                )}
            </div>
        </div>
    );
}

function LoadingOverlay() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
    );
}

// ── Helpers ──
function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, x + (w - sw) / 2, y + (h - sh) / 2, sw, sh);
}

function drawGradientBg(ctx: CanvasRenderingContext2D) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1e293b");
    g.addColorStop(1, "#0f172a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
    return t + "…";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
