export function Card({ children, className = "", variant = "standard", ...props }: React.HTMLAttributes<HTMLElement> & { variant?: "standard" | "minimal" | "primary" | "highlight" }) {
  const variants = {
    standard: "border border-line/80 bg-panel shadow-soft",
    minimal: "border-y border-line/70 bg-transparent",
    primary: "border border-core/20 bg-panel shadow-lift",
    highlight: "border border-core/25 bg-core/[0.06]",
  };
  return (
    <section {...props} className={`rounded-product p-4 sm:p-5 ${variants[variant]} ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold tracking-[-0.015em] text-ink">{title}</h2>
      {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
    </div>
  );
}
