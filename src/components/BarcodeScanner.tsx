import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Flashlight, X } from "lucide-react";

const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

function isValidGtin(code: string) {
  if (!GTIN_LENGTHS.has(code.length) || !/^\d+$/.test(code)) return false;

  let sum = 0;
  let weight = 3;

  for (let i = code.length - 2; i >= 0; i -= 1) {
    sum += Number(code[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }

  const expectedCheckDigit = (10 - (sum % 10)) % 10;
  return expectedCheckDigit === Number(code.at(-1));
}

export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(false);
  const [flash, setFlash] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controls: { stop: () => void } | null = null;
    let activeStream: MediaStream | null = null;

    (async () => {
      const zxing = await import("@zxing/library");
      const { BarcodeFormat, DecodeHintType } = zxing;
      if (cancelled) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        activeStream = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play().catch(() => {});

        controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result && !detectedRef.current) {
            const code = result.getText().trim();
            if (!isValidGtin(code)) return;
            detectedRef.current = true;
            try { navigator.vibrate?.(60); } catch { /* ignore */ }
            setFlash(true);
            onDetected(code);
          }
        });
        const track = stream.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        if (caps.torch) setTorchSupported(true);
      } catch (err) {
        console.error("Camera error", err);
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
      activeStream?.getTracks().forEach((t) => t.stop());
      trackRef.current = null;
    };
  }, [onDetected]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch (e) {
      console.error("Torch toggle failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-semibold">Point camera at barcode</span>
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              onClick={toggleTorch}
              aria-label="Toggle flashlight"
              className={`rounded-full p-2 transition ${torchOn ? "bg-primary text-primary-foreground" : "bg-white/10 text-white hover:bg-white/20"}`}
            >
              <Flashlight className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-72 max-w-[80vw] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-1/2 h-px animate-pulse bg-primary" />
          </div>
        </div>
        {flash && <div className="pointer-events-none absolute inset-0 animate-fade-in bg-primary/30" />}
      </div>
      <p className="p-4 text-center text-xs text-white/70">
        Hold steady, 6–10 inches away. Good lighting helps a lot.
      </p>
    </div>
  );
}