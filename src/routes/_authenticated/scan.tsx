import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, ShieldAlert, Sparkles, Upload, Leaf, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
import { HealthConcerns } from "@/components/HealthConcerns";
import { analyzeFoodImage, type ScanAnalysis } from "@/lib/scans.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/scan")({
  head: () => ({ meta: [{ title: "New scan — NutriScan" }] }),
  component: ScanPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ScanPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeFoodImage);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanAnalysis | null>(null);
  const [showConcerns, setShowConcerns] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image");
      return;
    }
    setResult(null);
    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);

      // Upload to storage (best-effort)
      let publicUrl: string | null = null;
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (uid) {
          const path = `${uid}/${crypto.randomUUID()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from("food-scans").upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
          if (!upErr) {
            publicUrl = supabase.storage.from("food-scans").getPublicUrl(path).data.publicUrl;
          }
        }
      } catch {
        // ignore upload errors; analysis can still proceed
      }

      const { analysis } = await analyze({ data: { imageDataUrl: dataUrl, imageUrl: publicUrl } });
      setResult(analysis);
      toast.success("Scan complete");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to analyze image";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Scan a <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">food label</span>
          </h1>
          <p className="text-sm text-muted-foreground">Upload a clear photo of the ingredients list.</p>
        </div>
        <Button variant="outline" size="sm" className="glass" onClick={() => setShowConcerns((v) => !v)}>
          <Heart className="mr-2 h-4 w-4 text-primary" />
          {showConcerns ? "Hide" : "My"} concerns
        </Button>
      </div>

      {showConcerns && (
        <div className="mb-6">
          <HealthConcerns />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="animate-fade-in rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)]">
          <div
            className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50"
          >
            {preview ? (
              <img src={preview} alt="Food label preview" className="h-full w-full animate-scale-in object-cover" />
            ) : (
              <>
                <Camera className="mb-3 h-10 w-10 animate-float" />
                <p className="text-sm">No image yet</p>
              </>
            )}
            {loading && (
              <div className="absolute inset-0 animate-shimmer" />
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button onClick={() => inputRef.current?.click()} variant="outline" disabled={loading}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button onClick={() => cameraRef.current?.click()} disabled={loading} className="shadow-[var(--shadow-soft)]">
              <Camera className="mr-2 h-4 w-4" /> Camera
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="animate-fade-in rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)]" style={{ animationDelay: "100ms" }}>
          {loading ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse-glow rounded-full" />
                <div className="relative flex h-14 w-14 animate-float items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)]">
                  <Sparkles className="h-6 w-6 animate-spin text-primary-foreground" style={{ animationDuration: "3s" }} />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium">Analyzing ingredients…</p>
              <p className="text-xs text-muted-foreground">Reading the label and scoring it</p>
            </div>
          ) : result ? (
            <div className="animate-fade-in"><ResultView result={result} /></div>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <ScanPlaceholder />
              <p className="max-w-xs text-sm">Choose an image to see the health score, harmful ingredients, and healthier alternatives.</p>
              <Link to="/dashboard" className="text-xs font-medium text-primary hover:underline">Back to dashboard</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ScanPlaceholder() {
  return (
    <div className="flex h-14 w-14 animate-float items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
      <Leaf className="h-6 w-6" />
    </div>
  );
}

function ResultView({ result }: { result: ScanAnalysis }) {
  const harmfulNames = new Set(result.harmful_ingredients.map((h) => h.name.toLowerCase()));
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Detected product</p>
          <h2 className="truncate text-xl font-bold">{result.product_name || "Unknown product"}</h2>
        </div>
        <HealthScore score={result.health_score} size={110} />
      </div>

      {result.summary && (
        <p className="animate-fade-in rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{result.summary}</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredients</h3>
        <div className="flex flex-wrap gap-2">
          {result.ingredients.length === 0 && <span className="text-sm text-muted-foreground">No ingredients detected.</span>}
          {result.ingredients.map((ing, i) => {
            const bad = harmfulNames.has(ing.toLowerCase());
            return (
              <span
                key={ing}
                style={{ animationDelay: `${i * 30}ms` }}
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
      </div>

      {result.harmful_ingredients.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-destructive">Harmful or to limit</h3>
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
        </div>
      )}

      {result.alternatives.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--success)]">Healthier alternatives</h3>
          <div className="space-y-2">
            {result.alternatives.map((a, i) => (
              <div
                key={a.name}
                style={{ animationDelay: `${i * 80}ms` }}
                className="animate-fade-in rounded-xl border border-[color-mix(in_oklab,var(--success)_25%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] p-3 hover-lift"
              >
                <p className="font-semibold text-foreground">{a.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{a.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}