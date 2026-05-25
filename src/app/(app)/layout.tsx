import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";
import { getCurrentUser, getTrustedDevice } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gatekeeper: si no hay sesión, redirigir al login
  const user = await getCurrentUser();
  if (!user) {
    const device = await getTrustedDevice();
    redirect(device ? "/login/pin" : "/login");
  }

  return (
    <div className="flex min-h-screen lg:h-screen">
      <div className="hidden lg:flex">
        <Sidebar user={{ name: user.name, role: user.role }} />
      </div>

      <main className="flex-1 lg:overflow-y-auto pb-24 lg:pb-0">
        <MobileHeader />
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
