import { Circle } from "lucide-react";

const tones = {
  neutral: "text-muted",
  active: "text-core",
  positive: "text-growth",
  warning: "text-pulse",
  critical: "text-ember",
};

export function StatusLabel({ children, tone = "neutral" }: { children: React.ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${tones[tone]}`}>
      <Circle size={7} aria-hidden="true" className="fill-current" />
      {children}
    </span>
  );
}
