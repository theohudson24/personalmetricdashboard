import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "border-core bg-core text-white shadow-soft hover:bg-core/90",
    secondary: "border-line bg-panel text-ink hover:border-core/50 hover:bg-core/[0.05]",
    ghost: "border-transparent bg-transparent text-muted hover:bg-ink/[0.05] hover:text-ink",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-product border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
