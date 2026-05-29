export function HealthScore({ score, size = 120 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 75 ? "var(--success)" : clamped >= 50 ? "var(--warning)" : "var(--destructive)";
  const label = clamped >= 75 ? "Healthy" : clamped >= 50 ? "Moderate" : "Avoid";
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--muted)"
            strokeWidth={10}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{clamped}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span
        className="rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
      >
        {label}
      </span>
    </div>
  );
}