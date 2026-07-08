import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Heart, ScanLine, Sparkles } from "lucide-react";
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
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:py-24">
          <div className="animate-slide-up">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
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
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { i: ScanLine, t: "Scan anything", d: "Camera, upload or barcode." },
              { i: Sparkles, t: "AI analysis", d: "0-100 score, harmful flags." },
              { i: Heart, t: "Personalized", d: "For your health concerns." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-border/60 glass p-5 text-left shadow-[var(--shadow-card)]">
                <f.i className="h-6 w-6 text-primary" />
                <p className="mt-3 font-semibold">{f.t}</p>
                <p className="text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
