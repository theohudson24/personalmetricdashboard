import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <WebVitalsReporter />
      <Sidebar />
      <main id="main-content" tabIndex={-1} className="min-h-screen px-4 pb-24 pt-6 sm:px-7 lg:ml-64 lg:px-10 lg:py-10 xl:px-14">
        <div className="mx-auto w-full max-w-[90rem]"><ConnectionStatus />{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
