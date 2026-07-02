import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "border-ink bg-ink text-white hover:bg-neutral-800",
    secondary: "border-line bg-white text-ink hover:bg-neutral-100",
    ghost: "border-transparent bg-transparent text-muted hover:bg-neutral-100 hover:text-ink",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
