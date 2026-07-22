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
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 bg-paper text-ink shadow-[20px_0_60px_rgba(0,0,0,0.28)] lg:block">
      <div className="flex h-full flex-col p-5">
        <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="grid h-11 w-11 place-items-center rounded-md border border-white/20 bg-white/10 text-growth shadow-[0_0_28px_rgba(122,168,79,0.24)]">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">Metric OS</p>
            <p className="text-xs text-white/60">Personal growth assistant</p>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm transition ${
                  active
                    ? "bg-core text-[#07100d] shadow-glow"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-5 text-xs leading-5 text-white/55">
          <Link href="/report-bug" className="mb-3 flex min-h-11 items-center gap-2 rounded-md px-3 text-white/70 hover:bg-white/10 hover:text-white"><Bug size={16}/>Report a bug</Link>
          <div className="mb-2 flex gap-3"><Link className="underline" href="/legal/privacy">Privacy</Link><Link className="underline" href="/legal/terms">Terms</Link></div>
          Private tracking for training, nutrition, recovery, and daily execution.
        </div>
      </div>
    </aside>
  );
}
