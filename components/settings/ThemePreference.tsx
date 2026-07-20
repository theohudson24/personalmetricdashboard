"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

export function ThemePreference() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("metric-theme") === "light" ? "light" : "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("light", saved === "light");
  }, []);

  function choose(next: "dark" | "light") {
    setTheme(next);
    localStorage.setItem("metric-theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  }

  return (
    <Card>
      <CardHeader title="Appearance" description="Choose the display mode used across the dashboard." />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => choose("dark")} className={`rounded-md border p-4 text-left ${theme === "dark" ? "border-core bg-core/10" : "border-line bg-black/10"}`}><Moon className="mb-3" size={20} /><span className="font-semibold">Dark</span></button>
        <button type="button" onClick={() => choose("light")} className={`rounded-md border p-4 text-left ${theme === "light" ? "border-core bg-core/10" : "border-line bg-black/10"}`}><Sun className="mb-3" size={20} /><span className="font-semibold">Light</span></button>
      </div>
    </Card>
  );
}
