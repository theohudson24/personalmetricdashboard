"use client";

import { Smartphone } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

export function InstallAppCard() {
  return <Card><CardHeader title="Install Metric OS" description="Open this secure site in Safari or Chrome to add it to your home screen."/><div className="flex gap-3 text-sm text-muted"><Smartphone size={20} className="shrink-0 text-core"/><p>On iPhone, use Share → Add to Home Screen. On Android or desktop Chrome, use the browser menu → Install app. Installed mode still requires a connection to read or save private account data.</p></div></Card>;
}
