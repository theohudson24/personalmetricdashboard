"use client";

import { Dumbbell, Flame, Home, Settings, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/self-improvement", label: "Improve", icon: TrendingUp },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-line/80 bg-panel/95 px-1 text-ink shadow-soft backdrop-blur-lg lg:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
              active ? "text-core after:absolute after:top-0 after:h-0.5 after:w-6 after:bg-core" : "text-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
