import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Flashlight, X, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const trackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let cancelled = false;
    let controls: { stop: () => void } | null = null;
    let activeStream: MediaStream | null = null;
    let rafId = 0;

    const accept = (raw: string) => {
      const code = raw.trim();
      if (detectedRef.current || !isValidGtin(code)) return;
      detectedRef.current = true;
      try { navigator.vibrate?.(60); } catch { /* ignore */ }
      setFlash(true);
      onDetected(code);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("This browser can't access the camera. Enter the barcode number below.");
          return;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        activeStream = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play().catch(() => {});

        const track = stream.getVideoTracks()[0] ?? null;
        trackRef.current = track;
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        if (caps.torch) setTorchSupported(true);

        // 1) Native detector (Chrome/Android) — far more reliable and much faster.
        const Detector = (window as unknown as {
          BarcodeDetector?: new (o?: { formats?: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> };
        }).BarcodeDetector;

        if (Detector) {
          const detector = new Detector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf"],
          });
          const tick = async () => {
            if (cancelled || detectedRef.current) return;
            try {
              const codes = await detector.detect(video);
              if (codes.length > 0) accept(codes[0].rawValue);
            } catch { /* frame not ready */ }
            if (!cancelled && !detectedRef.current) rafId = requestAnimationFrame(() => void tick());
          };
          void tick();
          return;
        }

        // 2) ZXing fallback (iOS Safari, Firefox).
        const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
        if (cancelled) return;
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
          BarcodeFormat.ITF,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 100 });
        controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) accept(result.getText());
        });
      } catch (err) {
        console.error("Camera error", err);
        const name = (err as { name?: string })?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera access was blocked. Allow camera in your browser settings, or type the barcode below."
            : name === "NotFoundError"
              ? "No camera found on this device. Type the barcode number below."
              : "Couldn't start the camera. Type the barcode number below.",
        );
      }
    })();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
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
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-40 w-72 max-w-[80vw] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-1/2 h-px animate-pulse bg-primary" />
          </div>
        </div>
        {flash && <div className="pointer-events-none absolute inset-0 animate-fade-in bg-primary/30" />}
        {error && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4 text-center text-sm text-white">{error}</div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <p className="text-center text-xs text-white/70">
          Hold steady, 6–10 inches away. Good lighting helps a lot.
        </p>
        <form
          className="mx-auto flex max-w-sm items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const code = manual.trim();
            if (!isValidGtin(code)) return;
            detectedRef.current = true;
            onDetected(code);
          }}
        >
          <Input
            value={manual}
            onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={14}
            placeholder="Or type the barcode digits"
            className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
          />
          <Button type="submit" size="sm" disabled={!isValidGtin(manual.trim())}>
            <Keyboard className="mr-2 h-4 w-4" /> Use
          </Button>
        </form>
      </div>
    </div>
  );
}