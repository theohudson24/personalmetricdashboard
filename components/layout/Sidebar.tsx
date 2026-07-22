"use client";

import { Activity, Bug, Dumbbell, Flame, Home, Settings, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/self-improvement", label: "Self-Improvement", icon: TrendingUp },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line/70 bg-panel text-ink lg:block">
      <div className="flex h-full flex-col px-5 py-7">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-product border border-core/25 bg-core/10 text-core">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em]">Metric OS</p>
            <p className="text-[11px] text-muted">Personal operating system</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Workspace</p>
        <nav aria-label="Primary navigation" className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex min-h-11 items-center gap-3 rounded-product px-3 text-sm transition-colors ${
                  active
                    ? "bg-core/10 font-semibold text-ink before:absolute before:-left-5 before:h-5 before:w-0.5 before:bg-core"
                    : "text-muted hover:bg-ink/[0.04] hover:text-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={17} className={active ? "text-core" : ""} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line/70 pt-5 text-xs leading-5 text-muted">
          <Link href="/report-bug" className="mb-3 flex min-h-10 items-center gap-2 rounded-product px-3 transition-colors hover:bg-ink/[0.04] hover:text-ink"><Bug size={15}/>Report a bug</Link>
          <div className="flex gap-3 px-3"><Link className="underline decoration-line underline-offset-4 hover:text-ink" href="/legal/privacy">Privacy</Link><Link className="underline decoration-line underline-offset-4 hover:text-ink" href="/legal/terms">Terms</Link></div>
        </div>
      </div>
    </aside>
  );
}
