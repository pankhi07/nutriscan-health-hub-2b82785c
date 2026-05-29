import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
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
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your scans</h1>
          <p className="text-sm text-muted-foreground">{scans.length} scan{scans.length === 1 ? "" : "s"} so far.</p>
        </div>
        <Link to="/scan">
          <Button size="lg" className="shadow-[var(--shadow-soft)]">
            <ScanLine className="mr-2 h-5 w-5" /> New scan
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <ScanLine className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">No scans yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scan your first packaged food to see its health score.</p>
          <Link to="/scan" className="mt-6 inline-block">
            <Button>Scan your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scans.map((scan) => {
            const harmful = Array.isArray(scan.harmful_ingredients) ? (scan.harmful_ingredients as { name: string }[]) : [];
            return (
              <div key={scan.id} className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-soft)]">
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