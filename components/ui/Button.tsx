import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  const styles = {
    primary: "border-core bg-core text-[#07100d] shadow-[0_10px_24px_rgba(77,183,167,0.2)] hover:bg-[#74cfc2]",
    secondary: "border-line bg-white/[0.07] text-ink hover:border-core/40 hover:bg-white/[0.1]",
    ghost: "border-transparent bg-transparent text-muted hover:bg-core/10 hover:text-core",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
