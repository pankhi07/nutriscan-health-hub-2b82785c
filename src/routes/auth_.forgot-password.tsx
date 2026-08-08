import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth_/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — NutriScan" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        console.error("Password reset error", error);
        if (/rate limit|too many/i.test(error.message)) {
          throw new Error("Too many reset emails were sent recently. Please wait a few minutes and try again.");
        }
        throw error;
      }
      setSent(true);
      toast.success("If that email has an account, a reset link is on its way.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--gradient-mesh)] opacity-60" />
      <div className="animate-slide-up relative w-full max-w-md rounded-3xl border border-border/60 glass p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-center text-sm text-muted-foreground">We'll email you a secure link.</p>
        </div>
        {sent ? (
          <div className="rounded-xl bg-primary/10 p-4 text-center text-sm text-foreground">
            <Mail className="mx-auto mb-2 h-6 w-6 text-primary" />
            Reset link sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Send reset link
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm">
          <Link to="/auth" className="text-primary hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}