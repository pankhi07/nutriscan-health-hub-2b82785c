import { Leaf } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={"flex items-center gap-2 " + (className ?? "")}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-soft)]">
        <Leaf className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Nutri<span className="text-primary">Scan</span>
      </span>
    </div>
  );
}