import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
import { HealthConcerns } from "@/components/HealthConcerns";
import { deleteScan, getScans } from "@/lib/scans.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NutriScan" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const router = useRouter();
  const fetchScans = useServerFn(getScans);
  const removeScan = useServerFn(deleteScan);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["scans"],
    queryFn: () => fetchScans(),
  });

  const scans = data?.scans ?? [];

  const onDelete = async (id: string) => {
    try {
      await removeScan({ data: { id } });
      toast.success("Scan deleted");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Your <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">scans</span>
          </h1>
          <p className="text-sm text-muted-foreground">{scans.length} scan{scans.length === 1 ? "" : "s"} so far.</p>
        </div>
        <Link to="/scan">
          <Button size="lg" className="shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]">
            <ScanLine className="mr-2 h-5 w-5" /> New scan
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <HealthConcerns />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative h-56 overflow-hidden rounded-2xl border border-border bg-card">
              <div className="absolute inset-0 animate-shimmer" />
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="animate-fade-in rounded-3xl border border-dashed border-border glass p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 animate-float items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <ScanLine className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scan your first packaged food to see its health score.</p>
          <Link to="/scan" className="mt-6 inline-block">
            <Button className="shadow-[var(--shadow-soft)]">Scan your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan, i) => {
            const harmful = Array.isArray(scan.harmful_ingredients) ? (scan.harmful_ingredients as { name: string }[]) : [];
            return (
              <div
                key={scan.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group animate-fade-in hover-lift flex flex-col gap-4 rounded-2xl border border-border/60 glass p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{scan.product_name ?? "Untitled product"}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => onDelete(scan.id)}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Delete scan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <HealthScore score={scan.health_score} size={96} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {harmful.slice(0, 3).map((h) => (
                      <div key={h.name} className="truncate rounded-md bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-2 py-1 text-xs text-destructive">
                        {h.name}
                      </div>
                    ))}
                    {harmful.length === 0 && (
                      <div className="rounded-md bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-2 py-1 text-xs text-[var(--success)]">
                        No harmful flags
                      </div>
                    )}
                  </div>
                </div>
                {scan.summary && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{scan.summary}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}