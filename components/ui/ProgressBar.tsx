export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div>
      {label ? <div className="mb-1 text-xs text-muted">{label}</div> : null}
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-ink" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
