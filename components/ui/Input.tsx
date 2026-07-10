import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-md border border-line bg-black/20 px-3 text-sm text-ink transition placeholder:text-muted/70 hover:border-core/40 focus:border-core"
      {...props}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-md border border-line bg-black/20 px-3 text-sm text-ink transition focus:border-core"
      {...props}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-24 w-full rounded-md border border-line bg-black/20 px-3 py-2 text-sm text-ink transition placeholder:text-muted/70 focus:border-core"
      {...props}
    />
  );
}
