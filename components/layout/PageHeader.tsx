export function PageHeader({
  title,
  description,
  eyebrow = "Personal dashboard",
}: {
  title: string;
  description: string;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 overflow-hidden rounded-lg border border-white/10 bg-white/[0.055] p-5 shadow-soft backdrop-blur sm:p-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-core">
        {eyebrow}
      </p>
      <h1 className="max-w-4xl text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </header>
  );
}
