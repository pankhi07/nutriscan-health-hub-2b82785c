import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/"><Logo /></Link>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">No login required</span>
      </div>
    </header>
  );
}