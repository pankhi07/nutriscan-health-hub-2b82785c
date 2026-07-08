import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Heart, ScanLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
import { listScans, listFavorites } from "@/lib/scans-crud.functions";
import { getProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Home — NutriScan" }] }),
  component: Dashboard,
});

const TIPS = [
  "Aim for less than 5g of added sugar per serving.",
  "Watch for hydrogenated oils — a source of trans fats.",
  "Fewer ingredients on the label usually means less processing.",
  "Sodium above 400mg per serving is high — check your daily intake.",
  "'Natural flavor' can hide dozens of undisclosed additives.",
  "Whole grains should be listed as the FIRST ingredient.",
  "Palm oil is linked to high saturated fat — limit it.",
];

function Dashboard() {
  const navigate = useNavigate();
  const listScansFn = useServerFn(listScans);
  const listFavsFn = useServerFn(listFavorites);
  const profileFn = useServerFn(getProfile);

  const scansQ = useQuery({ queryKey: ["scans"], queryFn: () => listScansFn() });
  const favsQ = useQuery({ queryKey: ["favorites"], queryFn: () => listFavsFn() });
  const profQ = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const tip = TIPS[new Date().getDate() % TIPS.length];
  const recent = (scansQ.data ?? []).slice(0, 3);
  const favs = (favsQ.data ?? []).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <section className="animate-slide-up rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Welcome back</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Hi {profQ.data?.full_name?.split(" ")[0] ?? "there"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Ready to scan something new?</p>
          </div>
          <Button size="lg" className="shadow-[var(--shadow-soft)]" onClick={() => navigate({ to: "/scan" })}>
            <ScanLine className="mr-2 h-4 w-4" /> Quick scan
          </Button>
        </div>

        <div className="mt-5 rounded-2xl bg-[image:var(--gradient-primary)] p-5 text-primary-foreground shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Daily health tip</p>
              <p className="mt-1 text-sm font-medium">{tip}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent scans</h2>
          <Link to="/history" className="text-sm font-medium text-primary hover:underline">See all →</Link>
        </div>
        {scansQ.isLoading ? (
          <SkeletonRow />
        ) : recent.length === 0 ? (
          <EmptyState label="No scans yet" cta="Start scanning" onClick={() => navigate({ to: "/scan" })} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((s) => (
              <ScanTile key={s.id} scan={s} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <Link to="/favorites" className="text-sm font-medium text-primary hover:underline">See all →</Link>
        </div>
        {favsQ.isLoading ? (
          <SkeletonRow />
        ) : favs.length === 0 ? (
          <EmptyState label="No favorites yet" cta="Explore scans" onClick={() => navigate({ to: "/history" })} icon={Heart} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((f) => f.scans && <ScanTile key={f.scan_id} scan={f.scans as any} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function ScanTile({ scan }: { scan: any }) {
  return (
    <Link to="/history" className="hover-lift group flex items-center gap-4 rounded-2xl border border-border/60 glass p-4 shadow-[var(--shadow-card)]">
      {scan.image_url ? (
        <img src={scan.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ScanLine className="h-5 w-5" /></div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{scan.product_name || "Unknown product"}</p>
        {scan.brand && <p className="truncate text-xs text-muted-foreground">{scan.brand}</p>}
      </div>
      <HealthScore score={scan.health_score} size={56} />
    </Link>
  );
}

function SkeletonRow() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />)}
    </div>
  );
}

function EmptyState({ label, cta, onClick, icon: Icon = ScanLine }: { label: string; cta: string; onClick: () => void; icon?: any }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center">
      <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button className="mt-3" size="sm" onClick={onClick}>{cta} <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>
    </div>
  );
}