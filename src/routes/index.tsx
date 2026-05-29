import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, ShieldAlert, Sparkles, History } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriScan — Scan packaged food, get a health score" },
      { name: "description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful ingredient flags, and healthier alternatives." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-card)]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered ingredient analysis
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Know what's really <span className="text-primary">in your food.</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              Snap a photo of any packaged food label. NutriScan reads the ingredients, flags
              the harmful ones, scores it out of 100, and suggests healthier swaps.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/signup">
                <Button size="lg" className="shadow-[var(--shadow-soft)]">
                  <ScanLine className="mr-2 h-5 w-5" /> Start scanning free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">I already have an account</Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-[image:var(--gradient-primary)] opacity-20 blur-3xl" />
            <div className="relative grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Crunchy Snack Bar</p>
                  <p className="text-lg font-semibold">Health score</p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-2xl font-bold text-destructive">
                  38
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-sm text-destructive">
                  <ShieldAlert className="h-4 w-4" /> High-fructose corn syrup
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-sm text-destructive">
                  <ShieldAlert className="h-4 w-4" /> Artificial color (Red 40)
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                  Whole oats, almonds, honey
                </div>
              </div>
              <div className="rounded-lg bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-3 py-2 text-sm text-foreground">
                <span className="font-semibold text-[var(--success)]">Try instead:</span> Plain oats + honey bar
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 pb-20 md:grid-cols-3">
          {[
            { icon: ScanLine, title: "Scan any label", body: "Upload a photo or use your camera. Works on any packaged food." },
            { icon: ShieldAlert, title: "Spot the bad stuff", body: "Artificial colors, trans fats, hidden sugars — flagged in red." },
            { icon: History, title: "Track your history", body: "Every scan is saved to your dashboard so you can compare over time." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
