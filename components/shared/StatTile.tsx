export function StatTile({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "missing";
}) {
  return (
    <div
      className={`group border-l-2 px-4 py-3 transition-colors ${
        tone === "missing"
          ? "border-ember bg-ember/[0.06]"
          : "border-line bg-transparent hover:border-core"
      }`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tracking-[-0.025em] ${tone === "missing" ? "text-ember" : "text-ink"}`}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted">{helper}</p> : null}
    </div>
  );
}
