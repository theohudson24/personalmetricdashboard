import { MobileNav } from "@/components/layout/MobileNav";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-ink">
      <Sidebar />
      <main className="min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
