import { Leaf } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2 " + (className ?? "")}>
      <div className="group relative flex h-9 w-9 items-center justify-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)] transition-transform duration-300 hover:rotate-6 hover:scale-110">
        <div className="absolute inset-0 rounded-2xl bg-[image:var(--gradient-primary)] opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70" />
        <Leaf className="relative h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Nutri<span className="text-primary">Scan</span>
      </span>
    </div>
  );
}