"use client";

import { Dumbbell, Home, Settings, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/gym", label: "Gym", icon: Dumbbell },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white lg:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
              active ? "text-ink" : "text-muted"
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
