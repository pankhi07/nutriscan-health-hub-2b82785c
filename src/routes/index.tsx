import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine, ShieldAlert, Sparkles, History, Heart, ArrowRight } from "lucide-react";
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative mesh background */}
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-64 h-80 w-80 animate-blob rounded-full bg-[color-mix(in_oklab,var(--success)_60%,transparent)] blur-3xl" style={{ animationDelay: "3s" }} />

      <div className="relative">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 sm:px-6">
          <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
            <div className="space-y-6">
              <span className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs font-medium text-muted-foreground shadow-[var(--shadow-card)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                AI-powered ingredient analysis
              </span>
              <h1 className="animate-slide-up text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
                Know what's really{" "}
                <span className="relative inline-block">
                  <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">in your food.</span>
                  <span className="absolute -bottom-1 left-0 h-1 w-full origin-left animate-[scale-in_0.8s_ease-out_0.5s_both] rounded-full bg-[image:var(--gradient-primary)]" />
                </span>
              </h1>
              <p className="animate-slide-up max-w-lg text-lg text-muted-foreground" style={{ animationDelay: "150ms" }}>
                Snap a photo of any packaged food label. NutriScan reads the ingredients, flags harmful ones, scores it out of 100, and suggests alternatives — tailored to{" "}
                <span className="font-semibold text-foreground">your health concerns</span>.
              </p>
              <div className="animate-slide-up flex flex-wrap gap-3" style={{ animationDelay: "300ms" }}>
                <Link to="/signup">
                  <Button size="lg" className="group shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]">
                    <ScanLine className="mr-2 h-5 w-5" /> Start scanning free
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="glass">I already have an account</Button>
                </Link>
              </div>
            </div>

            <div className="relative animate-scale-in" style={{ animationDelay: "200ms" }}>
              <div className="absolute -inset-6 rounded-[2rem] bg-[image:var(--gradient-primary)] opacity-30 blur-3xl animate-pulse" />
              <div className="relative grid gap-4 rounded-[1.75rem] border border-border/60 glass p-6 shadow-[var(--shadow-soft)] hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Crunchy Snack Bar</p>
                    <p className="text-lg font-semibold">Health score</p>
                  </div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)] text-2xl font-bold text-destructive">
                    <span className="absolute inset-0 animate-pulse-glow rounded-full" style={{ ['--tw-shadow-color' as never]: 'var(--destructive)' }} />
                    38
                  </div>
                </div>
                <div className="space-y-2">
                  {["High-fructose corn syrup", "Artificial color (Red 40)"].map((t, i) => (
                    <div
                      key={t}
                      style={{ animationDelay: `${400 + i * 100}ms` }}
                      className="animate-fade-in flex items-center gap-2 rounded-lg bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] px-3 py-2 text-sm text-destructive"
                    >
                      <ShieldAlert className="h-4 w-4" /> {t}
                    </div>
                  ))}
                  <div className="animate-fade-in flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground" style={{ animationDelay: "600ms" }}>
                    Whole oats, almonds, honey
                  </div>
                </div>
                <div className="animate-fade-in rounded-lg border border-[color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-3 py-2 text-sm text-foreground" style={{ animationDelay: "750ms" }}>
                  <span className="font-semibold text-[var(--success)]">For diabetics, try:</span> Plain oats + honey bar
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 pb-20 md:grid-cols-4">
            {[
              { icon: ScanLine, title: "Scan any label", body: "Upload a photo or use your camera. Works on any packaged food." },
              { icon: ShieldAlert, title: "Spot the bad stuff", body: "Artificial colors, trans fats, hidden sugars — flagged in red." },
              { icon: Heart, title: "Made for you", body: "Add your health concerns — diabetic, allergies, illness — for personalized advice." },
              { icon: History, title: "Track your history", body: "Every scan is saved so you can compare and improve over time." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                style={{ animationDelay: `${i * 100}ms` }}
                className="group animate-fade-in hover-lift relative overflow-hidden rounded-2xl border border-border/60 glass p-6"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[image:var(--gradient-primary)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30" />
                <div className="relative">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)] transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </section>

          <section className="mb-20">
            <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[image:var(--gradient-primary)] p-10 text-center text-primary-foreground shadow-[var(--shadow-soft)] md:p-16">
              <div className="absolute -left-10 -top-10 h-40 w-40 animate-blob rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-40 w-40 animate-blob rounded-full bg-white/20 blur-3xl" style={{ animationDelay: "4s" }} />
              <Sparkles className="mx-auto mb-4 h-8 w-8 animate-float" />
              <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight md:text-4xl">Eat smarter. Live better.</h2>
              <p className="mx-auto mt-3 max-w-md opacity-90">Personalized food intelligence in seconds.</p>
              <Link to="/signup" className="mt-6 inline-block">
                <Button size="lg" variant="secondary" className="hover-lift">
                  <ScanLine className="mr-2 h-5 w-5" /> Get started — it's free
                </Button>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
