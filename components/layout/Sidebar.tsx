"use client";

import { Activity, Dumbbell, Home, Settings, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">
      <div className="flex h-full flex-col p-5">
        <div className="mb-8 flex items-center gap-3 border-b border-line pb-5">
          <div className="grid h-10 w-10 place-items-center rounded-md border border-ink bg-ink text-white">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold">Metric OS</p>
            <p className="text-xs text-muted">Health command center</p>
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
                    ? "bg-ink text-white"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-ink"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-line pt-5 text-xs leading-5 text-muted">
          Local-first tracking for training, nutrition, and daily consistency.
        </div>
      </div>
    </aside>
  );
}
