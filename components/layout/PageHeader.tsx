export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Personal dashboard
      </p>
      <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
    </header>
  );
}
