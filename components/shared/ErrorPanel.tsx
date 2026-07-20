"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ErrorPanel({ error, reset, global = false }: { error: Error & { digest?: string }; reset: () => void; global?: boolean }) {
  const pathname = usePathname();
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  const task = pathname.startsWith("/meals") ? "nutrition data" : pathname.startsWith("/gym") ? "workout data" : pathname.startsWith("/settings") ? "account settings" : pathname.startsWith("/habits") ? "habit data" : "this page";
  const reportUrl = `/report-bug?page=${encodeURIComponent(pathname)}${error.digest ? `&reference=${encodeURIComponent(error.digest)}` : ""}`;

  useEffect(() => {
    if (offline) return;
    const width = window.screen.width;
    const deviceClass = width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop";
    void fetch("/api/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ route: pathname, category: "PAGE_LOAD", digest: error.digest, deviceClass }), keepalive: true });
  }, [error.digest, offline, pathname]);

  return <div className={`${global ? "min-h-screen" : "min-h-[65vh]"} grid place-items-center p-5`}>
    <Card className="max-w-2xl text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ember/15 text-ember">{offline ? <WifiOff size={26}/> : <AlertTriangle size={26}/>}</div>
      <h1 className="mt-4 text-2xl font-semibold">{offline ? "You appear to be offline" : `We couldn't load ${task}`}</h1>
      <p className="mt-3 text-muted">{offline ? "This request could not reach the server. Reconnect to the internet, then try again." : "This appears to be an issue on our end. We know about this type of bug, and our development team is working hard to keep the application reliable."}</p>
      {error.digest ? <p className="mt-3 text-xs text-muted">Error reference: {error.digest}</p> : null}
      <div className="mt-5 flex flex-wrap justify-center gap-3"><Button onClick={reset}><RefreshCw size={16}/><span className="ml-2">Try again</span></Button><Link href={reportUrl} className="inline-flex min-h-11 items-center rounded-md border border-line bg-white/[0.07] px-4 text-sm font-medium text-ink">Report this bug</Link><Link href="/" className="inline-flex min-h-11 items-center rounded-md px-4 text-sm text-muted">Return home</Link></div>
    </Card>
  </div>;
}
