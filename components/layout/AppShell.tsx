import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-ink">
      <WebVitalsReporter />
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl"><ConnectionStatus />{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
