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
      <div className="h-2.5 overflow-hidden rounded-full border border-line bg-black/25">
        <div
          className="h-full rounded-full bg-core shadow-[0_0_12px_rgba(77,183,167,0.22)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
