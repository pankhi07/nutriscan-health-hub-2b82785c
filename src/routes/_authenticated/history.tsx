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
          <Input placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
      </div>

      {scansQ.isLoading ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <ScanLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{q ? "No matches." : "No scans yet."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s) => {
            const isFav = (favIdsQ.data ?? []).includes(s.id);
            return (
              <div key={s.id} className="hover-lift flex items-center gap-4 rounded-2xl border border-border/60 glass p-4 shadow-[var(--shadow-card)]">
                <button onClick={() => setOpenId(s.id)} className="flex flex-1 items-center gap-4 text-left">
                  {s.image_url ? (
                    <img src={s.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ScanLine className="h-5 w-5" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.product_name || "Unknown product"}</p>
                    {s.brand && <p className="truncate text-xs text-muted-foreground">{s.brand}</p>}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <HealthScore score={s.health_score} size={56} />
                </button>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => fav(s.id)} aria-label="Favorite">
                    <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Delete">
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
              <Button size="sm" variant="outline" onClick={() => setOpenId(null)}>Close</Button>
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