import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Camera, Heart, ScanLine, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NutriScan — Scan packaged food, get a health score" },
      { name: "description", content: "Snap a packaged food label and instantly get a 0-100 health score, harmful ingredient flags, and healthier alternatives tailored to your health." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-64 h-80 w-80 animate-blob rounded-full bg-[color-mix(in_oklab,var(--success)_60%,transparent)] blur-3xl" style={{ animationDelay: "3s" }} />
      <div className="relative">
        <AppHeader />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pt-20">
          <section className="mx-auto max-w-3xl animate-slide-up text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 glass px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-[var(--success)] animate-pulse-glow" />
              AI-powered nutrition analysis
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)] animate-float">
              <ScanLine className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Know what's in <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">your food</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Scan a packaged food label or barcode and instantly get a health score, harmful ingredient flags, and healthier alternatives tailored to your health.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)]">
                <Link to="/auth">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">I have an account</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Private & secure</span>
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Instant results</span>
              <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-primary" /> Personalized to you</span>
            </div>
          </section>

          <section className="mt-20 grid gap-4 sm:grid-cols-3">
            {[
              { i: ScanLine, t: "Scan anything", d: "Camera, upload or barcode." },
              { i: Sparkles, t: "AI analysis", d: "0-100 score, harmful flags." },
              { i: Heart, t: "Personalized", d: "For your health concerns." },
            ].map((f, idx) => (
              <div
                key={f.t}
                className="hover-lift animate-slide-up rounded-2xl border border-border/60 glass p-5 text-left shadow-[var(--shadow-card)]"
                style={{ animationDelay: `${100 + idx * 80}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.i className="h-5 w-5 text-primary" />
                </div>
                <p className="mt-4 font-semibold">{f.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </section>

          <section className="mt-24">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Three steps to a healthier cart</h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                { n: "01", i: Camera, t: "Scan the label", d: "Snap the ingredient list or scan the barcode with your camera." },
                { n: "02", i: Sparkles, t: "AI analyzes", d: "We check every ingredient against nutrition and additive databases." },
                { n: "03", i: Heart, t: "Get your score", d: "See a 0-100 health score, flags and swaps tailored to your goals." },
              ].map((s) => (
                <div key={s.n} className="hover-lift group relative overflow-hidden rounded-3xl border border-border/60 glass p-6 shadow-[var(--shadow-card)]">
                  <span className="absolute right-5 top-4 text-5xl font-black text-primary/10 transition-colors group-hover:text-primary/20">{s.n}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
                    <s.i className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-24 overflow-hidden rounded-3xl border border-border/60 bg-[image:var(--gradient-primary)] p-10 text-center text-primary-foreground shadow-[var(--shadow-soft)] sm:p-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start scanning in seconds</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm opacity-90 sm:text-base">
              Free forever. No credit card. Your data stays yours.
            </p>
            <div className="mt-6 flex justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                <Link to="/auth">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </section>

          <footer className="mt-16 border-t border-border/60 pt-8 pb-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} NutriScan — Eat smarter, feel better.
          </footer>
        </main>
      </div>
    </div>
  );
}