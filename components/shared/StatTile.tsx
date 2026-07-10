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
      className={`group rounded-md border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:-translate-y-0.5 hover:shadow-soft ${
        tone === "missing"
          ? "border-ember/50 bg-ember/12 hover:border-ember/70"
          : "border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.035] hover:border-core/40 hover:bg-white/[0.08]"
      }`}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${tone === "missing" ? "text-ember" : "text-ink"}`}>
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-muted">{helper}</p> : null}
    </div>
  );
}
