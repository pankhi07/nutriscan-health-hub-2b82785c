import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Barcode,
  Camera,
  Check,
  Heart,
  Leaf,
  Plus,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { HealthScore } from "@/components/HealthScore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analyzeBarcode, analyzeFoodImage, type ScanAnalysis } from "@/lib/scans.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriScan — Scan packaged food, get a health score" },
      { name: "description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful ingredient flags, and healthier alternatives tailored to your health concerns." },
    ],
  }),
  component: Index,
});

const PRESETS = [
  "Diabetic",
  "Gluten allergy",
  "Lactose intolerant",
  "Nut allergy",
  "High blood pressure",
  "High cholesterol",
  "Pregnancy",
  "Heart disease",
  "Kidney disease",
  "Low sodium",
  "Vegan",
  "Keto",
];

type Step = "concerns" | "scan" | "result";

function Index() {
  const [step, setStep] = useState<Step>("concerns");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const reset = () => {
    setStep("concerns");
    setConcerns([]);
    setResult(null);
    setPreview(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-64 h-80 w-80 animate-blob rounded-full bg-[color-mix(in_oklab,var(--success)_60%,transparent)] blur-3xl" style={{ animationDelay: "3s" }} />

      <div className="relative">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <Stepper step={step} />
          <div className="mt-8">
            {step === "concerns" && (
              <ConcernsStep
                concerns={concerns}
                setConcerns={setConcerns}
                onNext={() => setStep("scan")}
              />
            )}
            {step === "scan" && (
              <ScanStep
                concerns={concerns}
                preview={preview}
                setPreview={setPreview}
                onResult={(r) => {
                  setResult(r);
                  setStep("result");
                }}
                onBack={() => setStep("concerns")}
              />
            )}
            {step === "result" && result && (
              <ResultStep result={result} preview={preview} concerns={concerns} onReset={reset} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string; icon: typeof Heart }[] = [
    { id: "concerns", label: "Your concerns", icon: Heart },
    { id: "scan", label: "Scan label", icon: ScanLine },
    { id: "result", label: "Results", icon: Sparkles },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="animate-fade-in mx-auto flex max-w-xl items-center justify-between">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-500 ${
                  active
                    ? "bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)] scale-110"
                    : done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {active && <span className="absolute inset-0 animate-pulse-glow rounded-2xl" />}
                {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-2 h-px flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[image:var(--gradient-primary)] transition-all duration-700"
                  style={{ width: i < activeIdx ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConcernsStep({
  concerns,
  setConcerns,
  onNext,
}: {
  concerns: string[];
  setConcerns: (c: string[]) => void;
  onNext: () => void;
}) {
  const [custom, setCustom] = useState("");

  const toggle = (c: string) =>
    setConcerns(concerns.includes(c) ? concerns.filter((x) => x !== c) : [...concerns, c]);

  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const t = custom.trim();
    if (!t) return;
    if (concerns.includes(t)) return setCustom("");
    if (concerns.length >= 20) return toast.error("Max 20 concerns");
    setConcerns([...concerns, t]);
    setCustom("");
  };

  return (
    <div className="animate-slide-up relative overflow-hidden rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[image:var(--gradient-primary)] opacity-10 blur-3xl" />
      <div className="relative">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-11 w-11 animate-float items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What's your main <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">concern</span>?
            </h1>
            <p className="text-sm text-muted-foreground">Pick what applies — we'll personalize your analysis.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {PRESETS.map((c, i) => {
            const active = concerns.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggle(c)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={`animate-fade-in inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-95 ${
                  active
                    ? "border-transparent bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent hover:-translate-y-0.5"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {c}
              </button>
            );
          })}
          {concerns.filter((c) => !PRESETS.includes(c)).map((c) => (
            <span
              key={c}
              className="animate-scale-in inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[image:var(--gradient-primary)] px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)]"
            >
              {c}
              <button onClick={() => toggle(c)} aria-label={`Remove ${c}`} className="hover:opacity-70">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>

        <form onSubmit={addCustom} className="mt-5 flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add your own (e.g. iron deficiency)"
            maxLength={60}
            className="h-11"
          />
          <Button type="submit" variant="outline" size="icon" className="h-11 w-11 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNext}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Skip — no concerns
          </button>
          <Button
            onClick={onNext}
            size="lg"
            className="group shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ScanStep({
  concerns,
  preview,
  setPreview,
  onResult,
  onBack,
}: {
  concerns: string[];
  preview: string | null;
  setPreview: (p: string | null) => void;
  onResult: (r: ScanAnalysis) => void;
  onBack: () => void;
}) {
  const analyze = useServerFn(analyzeFoodImage);
  const analyzeCode = useServerFn(analyzeBarcode);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [barcodeIssue, setBarcodeIssue] = useState<{ code: string; kind: "invalid" | "missing" } | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      const { analysis } = await analyze({ data: { imageDataUrl: dataUrl, concerns } });
      onResult(analysis);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze image");
    } finally {
      setLoading(false);
    }
  };

  const handleBarcode = async (code: string) => {
    setScanning(false);
    setLoading(true);
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
        onResult(res.analysis);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't look up that barcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-slide-up rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
          <ScanLine className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Scan a food label</h1>
          <p className="text-sm text-muted-foreground">
            {concerns.length > 0
              ? `Personalizing for: ${concerns.slice(0, 3).join(", ")}${concerns.length > 3 ? ` +${concerns.length - 3}` : ""}`
              : "Take a clear photo of the ingredients list."}
          </p>
        </div>
      </div>

      <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition-all hover:border-primary/50">
        {preview ? (
          <img src={preview} alt="Food label preview" className="h-full w-full animate-scale-in object-cover" />
        ) : (
          <>
            <Camera className="mb-3 h-12 w-12 animate-float text-primary" />
            <p className="text-sm font-medium">No image yet</p>
            <p className="text-xs">Upload or capture the ingredients label</p>
          </>
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
            <div className="absolute inset-0 animate-shimmer" />
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-glow rounded-full" />
              <div className="relative flex h-14 w-14 animate-float items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)]">
                <Sparkles className="h-6 w-6 animate-spin text-primary-foreground" style={{ animationDuration: "3s" }} />
              </div>
            </div>
            <p className="text-sm font-semibold text-foreground">Analyzing ingredients…</p>
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
        <Button onClick={() => setScanning(true)} disabled={loading} size="lg" className="shadow-[var(--shadow-soft)]">
          <Barcode className="mr-2 h-4 w-4" /> Barcode
        </Button>
      </div>
      <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="mt-5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
      >
        ← Edit concerns
      </button>

      {scanning && (
        <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />
      )}

      {barcodeIssue && (
        <div className="animate-slide-up mt-5 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {barcodeIssue.kind === "invalid" ? (
                  <>
                    Barcode <span className="font-mono">{barcodeIssue.code}</span> looks incomplete, so we ignored that scan.
                  </>
                ) : (
                  <>
                    We scanned barcode <span className="font-mono">{barcodeIssue.code}</span>, but it isn't in our food database yet.
                  </>
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {barcodeIssue.kind === "invalid"
                  ? "This usually happens when the camera catches only part of the bars or a shelf label. Try another scan, or snap the ingredients list instead."
                  : "Many regional and Indian products aren't catalogued. Snap a photo of the ingredients list instead — we'll analyze it the same way."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => { setBarcodeIssue(null); cameraRef.current?.click(); }}>
                  <Camera className="mr-2 h-4 w-4" /> Take photo of label
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setBarcodeIssue(null); uploadRef.current?.click(); }}>
                  <Upload className="mr-2 h-4 w-4" /> Upload image
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setBarcodeIssue(null); setScanning(true); }}>
                  Try another barcode
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultStep({
  result,
  preview,
  concerns,
  onReset,
}: {
  result: ScanAnalysis;
  preview: string | null;
  concerns: string[];
  onReset: () => void;
}) {
  const harmfulNames = new Set(result.harmful_ingredients.map((h) => h.name.toLowerCase()));
  return (
    <div className="animate-slide-up space-y-6">
      {concerns.length > 0 && (
        <div className="rounded-3xl border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Your concerns</p>
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) => (
              <span
                key={c}
                className="inline-flex items-center rounded-full bg-[image:var(--gradient-primary)] px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Results are personalized based on these concerns.</p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex items-center gap-4">
          {preview && (
            <img src={preview} alt="Scanned" className="h-20 w-20 rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Detected product</p>
            <h2 className="truncate text-2xl font-bold">{result.product_name || "Unknown product"}</h2>
          </div>
          <HealthScore score={result.health_score} size={110} />
        </div>
        {result.summary && (
          <p className="mt-5 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{result.summary}</p>
        )}
      </div>

      <Section title="Ingredients" tone="muted">
        <div className="flex flex-wrap gap-2">
          {result.ingredients.length === 0 && <span className="text-sm text-muted-foreground">No ingredients detected.</span>}
          {result.ingredients.map((ing, i) => {
            const bad = harmfulNames.has(ing.toLowerCase());
            return (
              <span
                key={ing}
                style={{ animationDelay: `${i * 25}ms` }}
                className={
                  bad
                    ? "animate-scale-in inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] px-3 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/20"
                    : "animate-scale-in inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                }
              >
                {bad && <ShieldAlert className="h-3 w-3" />}
                {ing}
              </span>
            );
          })}
        </div>
      </Section>

      {result.harmful_ingredients.length > 0 && (
        <Section title="Harmful or to limit" tone="destructive">
          <div className="space-y-2">
            {result.harmful_ingredients.map((h, i) => (
              <div
                key={h.name}
                style={{ animationDelay: `${i * 80}ms` }}
                className="animate-fade-in rounded-xl border border-[color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-destructive">{h.name}</span>
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">
                    {h.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{h.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.alternatives.length > 0 && (
        <Section title="Healthier alternatives for you" tone="success">
          <div className="grid gap-2 sm:grid-cols-2">
            {result.alternatives.map((a, i) => (
              <div
                key={a.name}
                style={{ animationDelay: `${i * 80}ms` }}
                className="animate-fade-in hover-lift rounded-xl border border-[color-mix(in_oklab,var(--success)_25%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] p-4"
              >
                <div className="flex items-start gap-2">
                  <Leaf className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                  <div>
                    <p className="font-semibold text-foreground">{a.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{a.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="flex justify-center pb-10">
        <Button onClick={onReset} size="lg" className="group shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]">
          <RefreshCw className="mr-2 h-4 w-4 transition-transform group-hover:rotate-180" />
          Scan another product
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "muted" | "destructive" | "success";
  children: React.ReactNode;
}) {
  const colorMap = {
    muted: "text-muted-foreground",
    destructive: "text-destructive",
    success: "text-[var(--success)]",
  };
  return (
    <div className="animate-fade-in rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${colorMap[tone]}`}>{title}</h3>
      {children}
    </div>
  );
}
