import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppHeader() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/"><Logo /></Link>
        <nav className="flex items-center gap-2">
          {email ? (
            <>
              <Link to="/dashboard" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:inline">
                Dashboard
              </Link>
              <Link to="/scan">
                <Button size="sm">New scan</Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button size="sm" variant="ghost">Log in</Button></Link>
              <Link to="/signup"><Button size="sm">Get started</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}