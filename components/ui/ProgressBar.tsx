export function ProgressBar({
  value,
  max,
  label,
  tone = "default",
}: {
  value: number;
  max: number;
  label?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const toneClasses = {
    default: "bg-core",
    success: "bg-growth",
    warning: "bg-pulse",
    danger: "bg-ember",
  } as const;

  return (
    <div>
      {label ? <div className="mb-1 text-xs text-muted">{label}</div> : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-line/70">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${toneClasses[tone]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
