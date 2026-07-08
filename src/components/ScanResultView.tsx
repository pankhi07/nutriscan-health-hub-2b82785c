import { Leaf, ShieldAlert, Heart } from "lucide-react";
import { HealthScore } from "./HealthScore";
import { Button } from "./ui/button";

export type ScanRow = {
  id?: string;
  product_name?: string | null;
  brand?: string | null;
  barcode?: string | null;
  image_url?: string | null;
  ingredients: string[];
  harmful_ingredients: Array<{ name: string; reason: string; severity: "low" | "medium" | "high" }>;
  alternatives: Array<{ name: string; reason: string }>;
  nutrition?: Record<string, unknown> | null;
  health_score: number;
  summary?: string | null;
};

function Section({ title, tone, children }: { title: string; tone: "muted" | "destructive" | "success"; children: React.ReactNode }) {
  const colorMap = {
    muted: "text-muted-foreground",
    destructive: "text-destructive",
    success: "text-[var(--success)]",
  } as const;
  return (
    <div className="animate-fade-in rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h3 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${colorMap[tone]}`}>{title}</h3>
      {children}
    </div>
  );
}

export function ScanResultView({
  scan,
  concerns = [],
  favorited,
  onToggleFavorite,
  actions,
}: {
  scan: ScanRow;
  concerns?: string[];
  favorited?: boolean;
  onToggleFavorite?: () => void;
  actions?: React.ReactNode;
}) {
  const harmfulNames = new Set(scan.harmful_ingredients.map((h) => h.name.toLowerCase()));
  const nutritionEntries = scan.nutrition ? Object.entries(scan.nutrition).filter(([, v]) => v != null && v !== "") : [];
  return (
    <div className="animate-slide-up space-y-6">
      {concerns.length > 0 && (
        <div className="rounded-3xl border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Personalized for</p>
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) => (
              <span key={c} className="inline-flex items-center rounded-full bg-[image:var(--gradient-primary)] px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-soft)]">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex items-center gap-4">
          {scan.image_url && (
            <img src={scan.image_url} alt={scan.product_name ?? "Scanned"} className="h-20 w-20 rounded-2xl border border-border object-cover shadow-[var(--shadow-card)]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Product</p>
            <h2 className="break-words text-2xl font-bold leading-tight">{scan.product_name || "Unknown product"}</h2>
            {scan.brand && <p className="text-sm text-muted-foreground">{scan.brand}</p>}
          </div>
          <HealthScore score={scan.health_score} size={110} />
        </div>
        {scan.summary && (
          <p className="mt-5 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{scan.summary}</p>
        )}
        {(onToggleFavorite || actions) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {onToggleFavorite && (
              <Button size="sm" variant={favorited ? "default" : "outline"} onClick={onToggleFavorite}>
                <Heart className={`mr-2 h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                {favorited ? "Saved" : "Save to favorites"}
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>

      {nutritionEntries.length > 0 && (
        <Section title="Nutrition facts" tone="muted">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {nutritionEntries.map(([k, v]) => (
              <div key={k} className="rounded-xl bg-secondary/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.replaceAll("_", " ")}</p>
                <p className="text-sm font-semibold text-foreground">{String(v)}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Ingredients" tone="muted">
        <div className="flex flex-wrap gap-2">
          {scan.ingredients.length === 0 && <span className="text-sm text-muted-foreground">No ingredients detected.</span>}
          {scan.ingredients.map((ing, i) => {
            const bad = harmfulNames.has(ing.toLowerCase());
            return (
              <span
                key={`${ing}-${i}`}
                className={
                  bad
                    ? "inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--destructive)_12%,transparent)] px-3 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/20"
                    : "inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                }
              >
                {bad && <ShieldAlert className="h-3 w-3" />}
                {ing}
              </span>
            );
          })}
        </div>
      </Section>

      {scan.harmful_ingredients.length > 0 && (
        <Section title="Harmful or to limit" tone="destructive">
          <div className="space-y-2">
            {scan.harmful_ingredients.map((h) => (
              <div key={h.name} className="rounded-xl border border-[color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-destructive">{h.name}</span>
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">{h.severity}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{h.reason}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {scan.alternatives.length > 0 && (
        <Section title="Healthier alternatives" tone="success">
          <div className="grid gap-2 sm:grid-cols-2">
            {scan.alternatives.map((a) => (
              <div key={a.name} className="hover-lift rounded-xl border border-[color-mix(in_oklab,var(--success)_25%,transparent)] bg-[color-mix(in_oklab,var(--success)_8%,transparent)] p-4">
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
    </div>
  );
}