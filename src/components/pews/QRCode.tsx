import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QRCodeCard({ url, accent = "#3b82f6" }: { url: string; accent?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 1,
      color: { dark: accent, light: "#00000000" },
      errorCorrectionLevel: "H",
    }).catch(() => {});
    QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: accent, light: "#0b0b0f" } }).then(setDataUrl).catch(() => {});
  }, [url, accent]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-2xl border border-border bg-background/60 p-4 backdrop-blur-xl">
        <canvas ref={canvasRef} className="rounded-lg" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs font-mono hover:bg-card"
        >
          copy link
        </button>
        {dataUrl && (
          <a
            href={dataUrl}
            download="pews-qr.png"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            download png
          </a>
        )}
      </div>
      <div className="text-[10px] font-mono text-muted-foreground break-all text-center max-w-xs">{url}</div>
    </div>
  );
}
