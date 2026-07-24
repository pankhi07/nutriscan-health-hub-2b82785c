import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrialScanner } from "@/components/TrialScanner";
import { AppHeader } from "@/components/AppHeader";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/try")({
  head: () => ({
    meta: [
      { title: "Try NutriScan free — one scan, no account" },
      { name: "description", content: "Try NutriScan with one free scan — no account required. Get an instant health score and healthier alternatives." },
    ],
  }),
  component: TryPage,
});

function TryPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/scan", replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  const trialUsed = typeof window !== "undefined" && localStorage.getItem("nutriscan_trial_used") === "1";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 animate-blob rounded-full bg-primary/20 blur-3xl" />
      <div className="relative">
        <AppHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          {checking ? (
            <div className="h-64 animate-pulse rounded-3xl border border-border/60 bg-secondary/40" />
          ) : (
            <TrialScanner initialUsed={trialUsed} />
          )}
        </main>
      </div>
    </div>
  );
}
