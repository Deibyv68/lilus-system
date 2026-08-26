import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { MobileHeader } from "@/components/mobile-header";
import { getCurrentUser, getTrustedDevice } from "@/lib/auth";
import type { Metadata } from "next";

/**
 * El título y el `noindex` viven aquí y no en el layout raíz porque ese
 * ahora lo comparten el panel y la tienda. Lo que se ponga allí lo hereda
 * la web de cara al público.
 *
 * El `noindex` repite lo que ya manda el proxy por cabecera. Es a
 * propósito: son dos mecanismos distintos y no cuesta nada tener los dos.
 */
export const metadata: Metadata = {
  title: {
    default: "LILUS — Gestión de ventas",
    template: "%s · LILUS",
  },
  robots: { index: false, follow: false },
};

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

      {/*
        min-w-0 no es decorativo: sin él, esta página se rompe en móvil.

        Los hijos de un flex tienen `min-width: auto`, o sea que se niegan a
        encogerse por debajo del ancho de su contenido. Basta con una tabla
        ancha adentro para que <main> crezca más que la pantalla y toda la
        página se desplace de lado, y el `overflow-x-auto` de esa tabla nunca
        llegue a actuar porque nadie la obligó a caber.
      */}
      <main className="flex-1 min-w-0 lg:overflow-y-auto pb-24 lg:pb-0">
        <MobileHeader />
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
