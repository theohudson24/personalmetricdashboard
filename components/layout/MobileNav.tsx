"use client";

import { Dumbbell, Flame, Home, Settings, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/ascension", label: "Ascend", icon: TrendingUp },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-white/10 bg-paper/95 text-ink shadow-[0_-18px_50px_rgba(0,0,0,0.26)] backdrop-blur lg:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
              active ? "text-growth" : "text-white/60"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
