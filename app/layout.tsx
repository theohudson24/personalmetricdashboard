import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Personal Metric Dashboard",
  description: "A minimal health, gym, and nutrition progress tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Metric OS" },
};

export const viewport: Viewport = { themeColor: "#10231d" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <a href="#main-content" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-md bg-core px-4 py-2 text-[#07100d] focus:translate-y-0">Skip to content</a>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
