import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen lg:h-screen">
      {/* Sidebar solo desktop */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      <main className="flex-1 lg:overflow-y-auto pb-24 lg:pb-0">
        {/* Header simple en móvil */}
        <MobileHeader />

        <div className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Bottom nav solo móvil */}
      <BottomNav />
    </div>
  );
}
