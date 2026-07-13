export function HealthScore({ score, size = 120 }: { score: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color =
    clamped >= 75 ? "var(--success)" : clamped >= 50 ? "var(--warning)" : "var(--destructive)";
  const label = clamped >= 75 ? "Healthy" : clamped >= 50 ? "Moderate" : "Avoid";
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const scoreFontSize = Math.round(size * 0.22);
  const unitFontSize = Math.max(8, Math.round(size * 0.09));
  const labelVisible = size >= 72;

  return (
    <div className="flex flex-col items-center gap-1.5">
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
          <span
            className="font-bold text-foreground leading-none"
            style={{ fontSize: scoreFontSize }}
          >
            {clamped}
          </span>
          <span
            className="uppercase tracking-wider text-muted-foreground"
            style={{ fontSize: unitFontSize }}
          >
            / 100
          </span>
        </div>
      </div>
      {labelVisible && (
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)`, color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}