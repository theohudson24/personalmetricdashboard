"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  const pathname = usePathname();
  useReportWebVitals((metric) => {
    if (Math.random() > 0.25) return;
    const deviceClass = window.screen.width < 640 ? "mobile" : window.screen.width < 1024 ? "tablet" : "desktop";
    void fetch("/api/performance", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ route: pathname, name: metric.name, value: metric.value, rating: metric.rating, deviceClass }) });
  });
  return null;
}
