import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HealthScore } from "@/components/HealthScore";
import { listFavorites, toggleFavorite } from "@/lib/scans-crud.functions";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — NutriScan" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFavorites);
  const favFn = useServerFn(toggleFavorite);
  const favsQ = useQuery({ queryKey: ["favorites"], queryFn: () => listFn() });

  async function remove(id: string) {
    try {
      await favFn({ data: { scan_id: id } });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      qc.invalidateQueries({ queryKey: ["favorite-ids"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Favorites</h1>
        <p className="text-sm text-muted-foreground">Your bookmarked products.</p>
      </div>

      {favsQ.isLoading ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/60" />)}</div>
      ) : (favsQ.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No favorites yet. Tap the heart on any scan to save it here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {(favsQ.data ?? []).map((f: any) => (
            <div key={f.scan_id} className="hover-lift flex items-center gap-4 rounded-2xl border border-border/60 glass p-4 shadow-[var(--shadow-card)]">
              {f.scans.image_url ? (
                <img src={f.scans.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ScanLine className="h-5 w-5" /></div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{f.scans.product_name || "Unknown product"}</p>
                {f.scans.brand && <p className="truncate text-xs text-muted-foreground">{f.scans.brand}</p>}
              </div>
              <HealthScore score={f.scans.health_score} size={56} />
              <Button size="icon" variant="ghost" onClick={() => remove(f.scan_id)} aria-label="Remove favorite">
                <Heart className="h-4 w-4 fill-primary text-primary" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}