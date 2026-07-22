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
    <header className="mb-9 border-b border-line/70 pb-7 sm:flex sm:items-end sm:justify-between sm:gap-8">
      <div>
      <p className="eyebrow mb-3">
        {eyebrow}
      </p>
      <h1 className="max-w-4xl text-[2rem] font-semibold leading-[1.1] tracking-[-0.035em] text-ink sm:text-[2.5rem]">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-[0.9375rem]">{description}</p>
      </div>
    </header>
  );
}
