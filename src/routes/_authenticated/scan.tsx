import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Barcode, Camera, RefreshCw, ScanLine, Sparkles, Upload, ShieldAlert } from "lucide-react";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { analyzeBarcode, analyzeFoodImage, type ScanAnalysis } from "@/lib/scans.functions";
import { saveScan } from "@/lib/scans-crud.functions";
import { getProfile } from "@/lib/profile.functions";
import { ScanResultView } from "@/components/ScanResultView";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "Scan — NutriScan" }] }),
  component: ScanPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ScanPage() {
  const analyze = useServerFn(analyzeFoodImage);
  const analyzeCode = useServerFn(analyzeBarcode);
  const save = useServerFn(saveScan);
  const loadProfile = useServerFn(getProfile);
  const navigate = useNavigate();

  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [sessionConcerns, setSessionConcerns] = useState<string[]>([]);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [barcodeIssue, setBarcodeIssue] = useState<{ code: string; kind: "invalid" | "missing" } | null>(null);

  useEffect(() => {
    loadProfile().then((p) => {
      const c = [
        ...((p?.health_concerns as string[] | null) ?? []),
        ...((p?.allergies as string[] | null) ?? []).map((a) => `${a} allergy`),
      ];
      setConcerns(c);
    }).catch(() => {});
  }, [loadProfile]);

  const QUICK_CONCERNS = [
    "Diabetic",
    "High blood pressure",
    "High cholesterol",
    "Heart condition",
    "Weight loss",
    "Pregnancy",
    "Vegan",
    "Vegetarian",
    "Gluten-free",
    "Lactose intolerant",
    "Nut allergy",
    "Kids / child",
  ];

  function toggleConcern(c: string) {
    setSessionConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const activeConcerns = Array.from(new Set([...concerns, ...sessionConcerns]));

  async function persist(analysis: ScanAnalysis, opts: { image?: string | null; barcode?: string | null }) {
    try {
      const row = await save({
        data: {
          product_name: analysis.product_name || null,
          brand: null,
          barcode: opts.barcode ?? null,
          image_url: opts.image ?? null,
          ingredients: analysis.ingredients,
          harmful_ingredients: analysis.harmful_ingredients,
          alternatives: analysis.alternatives,
          nutrition: {},
          health_score: analysis.health_score,
          summary: analysis.summary,
        },
      });
      setSavedScanId(row.id as string);
    } catch (e) {
      console.error("saveScan failed", e);
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    setLoading(true);
    setResult(null);
    setSavedScanId(null);
    setBarcode(null);
    setBarcodeIssue(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const { analysis } = await analyze({ data: { imageDataUrl: dataUrl, concerns: activeConcerns } });
      setResult(analysis);
      persist(analysis, { image: dataUrl, barcode: null });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  }

  async function handleBarcode(code: string) {
    setScanning(false);
    setLoading(true);
    setResult(null);
    setPreview(null);
    setSavedScanId(null);
    setBarcodeIssue(null);
    toast.success(`Barcode ${code} detected`);
    try {
      const res = await analyzeCode({ data: { barcode: code, concerns: activeConcerns } });
      if (res.invalid) {
        setBarcodeIssue({ code, kind: "invalid" });
      } else if (res.notFound) {
        setBarcodeIssue({ code, kind: "missing" });
      } else if (res.analysis) {
        setBarcode(code);
        setResult(res.analysis);
        persist(res.analysis, { image: null, barcode: code });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't look up that barcode");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setPreview(null);
    setSavedScanId(null);
    setBarcode(null);
    setBarcodeIssue(null);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {!result ? (
        <div className="animate-slide-up rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Scan a food label</h1>
              <p className="text-sm text-muted-foreground">
                {activeConcerns.length > 0
                  ? `Personalizing for: ${activeConcerns.slice(0, 3).join(", ")}${activeConcerns.length > 3 ? ` +${activeConcerns.length - 3}` : ""}`
                  : "Pick your concerns below or add them in your Profile."}
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-border/60 bg-secondary/30 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Any concerns for this scan?</p>
              {sessionConcerns.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSessionConcerns([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Tap any that apply — we'll tailor the analysis and alternatives.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_CONCERNS.map((c) => {
                const active = sessionConcerns.includes(c) || concerns.includes(c);
                const fromProfile = concerns.includes(c) && !sessionConcerns.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleConcern(c)}
                    disabled={loading}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-all " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5")
                    }
                    title={fromProfile ? "From your profile" : undefined}
                  >
                    {c}
                    {fromProfile && <span className="ml-1 opacity-70">•</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full animate-scale-in object-cover" />
            ) : (
              <>
                <Camera className="mb-3 h-12 w-12 animate-float text-primary" />
                <p className="text-sm font-medium">Upload, snap, or scan a barcode</p>
              </>
            )}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)]">
                  <Sparkles className="h-6 w-6 animate-spin text-primary-foreground" style={{ animationDuration: "3s" }} />
                </div>
                <p className="text-sm font-semibold">Analyzing…</p>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button onClick={() => uploadRef.current?.click()} variant="outline" disabled={loading} size="lg">
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button onClick={() => cameraRef.current?.click()} variant="outline" disabled={loading} size="lg">
              <Camera className="mr-2 h-4 w-4" /> Photo
            </Button>
            <Button onClick={() => setScanning(true)} disabled={loading} size="lg">
              <Barcode className="mr-2 h-4 w-4" /> Barcode
            </Button>
          </div>
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {scanning && <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />}

          {barcodeIssue && (
            <div className="animate-slide-up mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><ShieldAlert className="h-4 w-4" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {barcodeIssue.kind === "invalid"
                      ? <>Barcode <span className="font-mono">{barcodeIssue.code}</span> looks incomplete.</>
                      : <>Barcode <span className="font-mono">{barcodeIssue.code}</span> isn't in our food database yet.</>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Snap a photo of the ingredients label instead — we'll analyze it the same way.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => { setBarcodeIssue(null); cameraRef.current?.click(); }}><Camera className="mr-2 h-4 w-4" /> Take photo</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setBarcodeIssue(null); setScanning(true); }}>Try another barcode</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <ScanResultView
            scan={{
              id: savedScanId ?? undefined,
              product_name: result.product_name,
              brand: null,
              barcode,
              image_url: preview,
              ingredients: result.ingredients,
              harmful_ingredients: result.harmful_ingredients,
              alternatives: result.alternatives,
              nutrition: {},
              health_score: result.health_score,
              summary: result.summary,
            }}
            concerns={activeConcerns}
            actions={
              <>
                <Button size="sm" variant="outline" onClick={reset}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Scan another
                </Button>
                {savedScanId && (
                  <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/history" })}>
                    View history
                  </Button>
                )}
              </>
            }
          />
        </div>
      )}
    </main>
  );
}