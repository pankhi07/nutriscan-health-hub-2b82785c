import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Set new password — NutriScan" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  // The reset email can arrive in three shapes depending on Supabase flow:
  //   #access_token=...&type=recovery   (implicit)
  //   ?code=...                          (PKCE)
  //   ?token_hash=...&type=recovery      (email OTP link)
  // Establish a session from whichever is present before allowing the update.
  useEffect(() => {
    let active = true;
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      try {
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (tokenHash) {
          await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
        }
      } catch (e) {
        console.error("Recovery link exchange failed", e);
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) {
        window.history.replaceState({}, "", "/reset-password");
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
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
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        </div>
        {status === "checking" && (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Verifying your reset link…
          </p>
        )}
        {status === "invalid" && (
          <div className="space-y-4 text-center">
            <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one.
            </p>
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Send a new reset link
            </Link>
          </div>
        )}
        {status === "ready" && (
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update password
          </Button>
        </form>
        )}
      </div>
    </div>
  );
}