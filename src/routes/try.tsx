import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Barcode, Camera, ScanLine, Sparkles, Upload, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { analyzeBarcode, analyzeFoodImage, type ScanAnalysis } from "@/lib/scans.functions";
import { ScanResultView } from "@/components/ScanResultView";
import { supabase } from "@/integrations/supabase/client";

const TRIAL_KEY = "nutriscan_trial_used";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try NutriScan free — one scan, no account" },
      { name: "description", content: "Try NutriScan with one free scan — no account required. Get an instant health score and healthier alternatives." },
    ],
  }),
  component: TryPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const QUICK_CONCERNS = [
  "Diabetic",
  "High blood pressure",
  "High cholesterol",
  "Weight loss",
  "Pregnancy",
  "Vegan",
  "Vegetarian",
  "Gluten-free",
  "Lactose intolerant",
  "Nut allergy",
  "Keto / Low-carb",
  "Low sodium",
];

function TryPage() {
  const analyze = useServerFn(analyzeFoodImage);
  const analyzeCode = useServerFn(analyzeBarcode);
  const navigate = useNavigate();

  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(true);
  const [trialUsed, setTrialUsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [barcodeIssue, setBarcodeIssue] = useState<{ code: string; kind: "invalid" | "missing" } | null>(null);

  useEffect(() => {
    // If signed in, send them straight to the real scanner
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/scan", replace: true });
        return;
      }
      setTrialUsed(localStorage.getItem(TRIAL_KEY) === "1");
      setChecking(false);
    });
  }, [navigate]);

  function toggleConcern(c: string) {
    setConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function markTrialUsed() {
    try { localStorage.setItem(TRIAL_KEY, "1"); } catch { /* ignore */ }
    setTrialUsed(true);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    setLoading(true);
    setResult(null);
    setBarcode(null);
    setBarcodeIssue(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const { analysis } = await analyze({ data: { imageDataUrl: dataUrl, concerns } });
      setResult(analysis);
      markTrialUsed();
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
    setBarcodeIssue(null);
    toast.success(`Barcode ${code} detected`);
    try {
      const res = await analyzeCode({ data: { barcode: code, concerns } });
      if (res.invalid) {
        setBarcodeIssue({ code, kind: "invalid" });
      } else if (res.notFound) {
        setBarcodeIssue({ code, kind: "missing" });
      } else if (res.analysis) {
        setBarcode(code);
        setResult(res.analysis);
        markTrialUsed();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't look up that barcode");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {checking ? (
            <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-secondary/40" />
          ) : trialUsed && !result ? (
            <TrialUsedCard />
          ) : !result ? (
            <div className="animate-slide-up rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Free trial — 1 scan, no account
              </div>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
                  <ScanLine className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Try one free scan</h1>
                  <p className="text-sm text-muted-foreground">See NutriScan in action — no signup needed.</p>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border border-border/60 bg-secondary/30 p-4">
                <p className="mb-2 text-sm font-semibold">Any concerns for this scan?</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_CONCERNS.map((c) => {
                    const active = concerns.includes(c);
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
                      >
                        {c}
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
                  product_name: result!.product_name,
                  brand: null,
                  barcode,
                  image_url: preview,
                  ingredients: result!.ingredients,
                  harmful_ingredients: result!.harmful_ingredients,
                  alternatives: result!.alternatives,
                  nutrition: {},
                  health_score: result!.health_score,
                  summary: result!.summary,
                }}
                concerns={concerns}
              />
              <CreateAccountCTA />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CreateAccountCTA() {
  return (
    <div className="animate-slide-up overflow-hidden rounded-3xl border border-border/60 bg-[image:var(--gradient-primary)] p-6 text-primary-foreground shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background/20"><Sparkles className="h-5 w-5" /></div>
        <div className="flex-1">
          <h2 className="text-xl font-bold sm:text-2xl">That was your free scan</h2>
          <p className="mt-1 text-sm opacity-90">Create a free account to keep scanning, save history, favorite products, and get results tailored to your health profile.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              <Link to="/auth">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-background/15">
              <Link to="/auth">I have an account</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialUsedCard() {
  return (
    <div className="animate-slide-up rounded-3xl border border-border/60 glass p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">You've used your free scan</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Hope you liked it! Create a free account to keep scanning, save your history, and get results personalized to your health.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild size="lg">
          <Link to="/auth">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    </div>
  );
}