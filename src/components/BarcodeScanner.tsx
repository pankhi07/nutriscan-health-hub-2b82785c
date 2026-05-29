import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import pkg from "@zxing/library";
const { BarcodeFormat, DecodeHintType } = pkg;
import { X } from "lucide-react";

export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);
    const reader = new BrowserMultiFormatReader(hints);
    let controls: { stop: () => void } | null = null;

    (async () => {
      try {
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              onDetected(result.getText());
            }
          },
        );
      } catch (err) {
        console.error("Camera error", err);
      }
    })();

    return () => {
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-semibold">Point camera at barcode</span>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-72 max-w-[80vw] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-1/2 h-px animate-pulse bg-primary" />
          </div>
        </div>
      </div>
      <p className="p-4 text-center text-xs text-white/70">
        Hold steady. Detection happens automatically.
      </p>
    </div>
  );
}