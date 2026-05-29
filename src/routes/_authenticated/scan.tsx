import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Camera, ShieldAlert, Sparkles, Upload, Leaf } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Scan a food label</h1>
        <p className="text-sm text-muted-foreground">Upload a clear photo of the ingredients list.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div
            className="flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-secondary/50 text-muted-foreground"
          >
            {preview ? (
              <img src={preview} alt="Food label preview" className="h-full w-full object-cover" />
            ) : (
              <>
                <Camera className="mb-3 h-10 w-10" />
                <p className="text-sm">No image yet</p>
              </>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button onClick={() => inputRef.current?.click()} variant="outline" disabled={loading}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
            <Button onClick={() => cameraRef.current?.click()} disabled={loading}>
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

        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          {loading ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-[image:var(--gradient-primary)]">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium">Analyzing ingredients…</p>
              <p className="text-xs text-muted-foreground">Reading the label and scoring it</p>
            </div>
          ) : result ? (
            <ResultView result={result} />
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
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
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
        <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{result.summary}</p>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ingredients</h3>
        <div className="flex flex-wrap gap-2">
          {result.ingredients.length === 0 && <span className="text-sm text-muted-foreground">No ingredients detected.</span>}
          {result.ingredients.map((ing) => {
            const bad = harmfulNames.has(ing.toLowerCase());
            return (
              <span
                key={ing}
                className={
                  bad
                    ? "inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] px-3 py-1 text-xs font-medium text-destructive"
                    : "inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
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
            {result.harmful_ingredients.map((h) => (
              <div key={h.name} className="rounded-lg border border-[color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] p-3">
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
            {result.alternatives.map((a) => (
              <div key={a.name} className="rounded-lg border border-[color-mix(in_oklab,var(--success)_25%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] p-3">
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