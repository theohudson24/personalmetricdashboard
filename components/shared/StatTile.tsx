export function StatTile({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "missing" | "success" | "warning" | "danger";
}) {
  const toneClasses = {
    default: "border-line bg-transparent hover:border-core",
    missing: "border-ember bg-ember/[0.06]",
    success: "border-growth bg-growth/[0.08]",
    warning: "border-pulse bg-pulse/[0.09]",
    danger: "border-ember bg-ember/[0.09]",
  } as const;
  const valueClasses = {
    default: "text-ink",
    missing: "text-ember",
    success: "text-growth",
    warning: "text-pulse",
    danger: "text-ember",
  } as const;

  return (
    <div
      className={`group border-l-2 px-4 py-3 transition-colors ${toneClasses[tone]}`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-[-0.025em] ${valueClasses[tone]}`}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted">{helper}</p> : null}
    </div>
  );
}
