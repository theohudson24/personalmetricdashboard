import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      className="w-full rounded-product border border-line bg-panel px-3 text-sm text-ink transition-colors placeholder:text-muted/70 hover:border-core/50 focus:border-core"
      {...props}
    />
  );
});

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-product border border-line bg-panel px-3 text-sm text-ink transition-colors focus:border-core"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-24 w-full rounded-product border border-line bg-panel px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-core"
      {...props}
    />
  );
}
