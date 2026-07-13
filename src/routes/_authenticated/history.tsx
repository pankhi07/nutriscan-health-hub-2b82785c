import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Heart, Search, Trash2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HealthScore } from "@/components/HealthScore";
import { ScanResultView } from "@/components/ScanResultView";
import { deleteScan, getScan, listScans, toggleFavorite, listFavoriteIds } from "@/lib/scans-crud.functions";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — NutriScan" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listScans);
  const delFn = useServerFn(deleteScan);
  const getFn = useServerFn(getScan);
  const favFn = useServerFn(toggleFavorite);
  const favIdsFn = useServerFn(listFavoriteIds);

  const scansQ = useQuery({ queryKey: ["scans"], queryFn: () => listFn() });
  const favIdsQ = useQuery({ queryKey: ["favorite-ids"], queryFn: () => favIdsFn() });
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const detailQ = useQuery({
    queryKey: ["scan", openId],
    queryFn: () => getFn({ data: { id: openId as string } }),
    enabled: !!openId,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = scansQ.data ?? [];
    if (!term) return list;
    return list.filter((s) =>
      (s.product_name ?? "").toLowerCase().includes(term) ||
      (s.brand ?? "").toLowerCase().includes(term)
    );
  }, [scansQ.data, q]);

  async function remove(id: string) {
    if (!confirm("Delete this scan?")) return;
    try {
      await delFn({ data: { id } });
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["scans"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      if (openId === id) setOpenId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function fav(id: string) {
    try {
      await favFn({ data: { scan_id: id } });
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Scan history</h1>
          <p className="text-sm text-muted-foreground">Sorted by newest first.</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search product…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-full border-border/60 bg-card pl-9 shadow-[var(--shadow-card)] transition-shadow focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {scansQ.isLoading ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <ScanLine className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{q ? "No matches found" : "No scans yet"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{q ? "Try a different search term." : "Scan a product to see it here."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s, i) => {
            const isFav = (favIdsQ.data ?? []).includes(s.id);
            return (
              <div
                key={s.id}
                className="hover-lift animate-fade-in group flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-[var(--shadow-card)] backdrop-blur-sm sm:gap-3 sm:p-4"
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                <button onClick={() => setOpenId(s.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
                  {s.image_url ? (
                    <img src={s.image_url} alt="" className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover sm:h-14 sm:w-14" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground sm:h-14 sm:w-14">
                      <ScanLine className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.product_name || "Unknown product"}</p>
                    {s.brand && <p className="truncate text-xs text-muted-foreground">{s.brand}</p>}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <div className="shrink-0">
                    <HealthScore score={s.health_score} size={48} />
                  </div>
                </button>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full" onClick={() => fav(s.id)} aria-label="Favorite">
                    <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 rounded-full" onClick={() => remove(s.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-background/80 p-4 backdrop-blur-sm" onClick={() => setOpenId(null)}>
          <div className="mx-auto my-8 w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex justify-end">
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setOpenId(null)}>Close</Button>
            </div>
            {detailQ.isLoading || !detailQ.data ? (
              <div className="h-64 animate-pulse rounded-3xl bg-secondary/60" />
            ) : (
              <ScanResultView
                scan={detailQ.data as any}
                favorited={(favIdsQ.data ?? []).includes(openId)}
                onToggleFavorite={() => fav(openId)}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}