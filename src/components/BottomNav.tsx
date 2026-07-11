import { Link } from "@tanstack/react-router";
import { Home, History, Heart, User, ScanLine } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/favorites", label: "Saved", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 glass pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="relative mx-auto flex max-w-md items-end justify-around px-3 pt-2 pb-2">
        {tabs.slice(0, 2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}
        <ScanTab />
        {tabs.slice(2).map((t) => (
          <TabLink key={t.to} {...t} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <Link
      to={to}
      className="group flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors"
      activeProps={{ className: "text-primary" }}
    >
      <Icon className="h-5 w-5 transition-transform group-active:scale-90" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ScanTab() {
  return (
    <div className="relative -mt-6 flex flex-1 justify-center">
      <Link
        to="/scan"
        aria-label="Scan"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-glow)] ring-4 ring-background transition-transform active:scale-95"
      >
        <ScanLine className="h-6 w-6" />
      </Link>
    </div>
  );
}