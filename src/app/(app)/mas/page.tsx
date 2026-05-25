import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import {
  Users,
  Truck,
  Settings,
  Boxes,
  ChevronRight,
  Printer,
  LogOut,
  UserCog,
} from "lucide-react";

export const dynamic = "force-dynamic";

const links = [
  { href: "/etiquetas", label: "Imprimir etiquetas", icon: Printer, description: "Imprimir etiquetas sueltas sin pedido" },
  { href: "/packs", label: "Packs", icon: Boxes, description: "Paquetes que agrupan productos" },
  { href: "/clientes", label: "Clientes", icon: Users, description: "Historial de personas que han comprado" },
  { href: "/envios", label: "Envíos", icon: Truck, description: "Zonas, transportadoras y tarifas" },
  { href: "/configuracion", label: "Configuración", icon: Settings, description: "Datos del remitente, marca" },
];

const adminLinks = [
  { href: "/configuracion/usuarios", label: "Usuarios", icon: UserCog, description: "Crear y administrar accesos" },
];

export default async function MasPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PageHeader title="Más opciones" />

      {/* Tarjeta del usuario actual */}
      {user && (
        <div className="rounded-2xl border bg-card p-4 mb-4 flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.role === "admin" ? "Administrador" : "Usuario"} ·{" "}
              <span className="font-mono">{user.username}</span>
            </p>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="size-4" /> Salir
            </Button>
          </form>
        </div>
      )}

      <ul className="space-y-2">
        {links.map(({ href, label, icon: Icon, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
            >
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {description}
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground shrink-0" />
            </Link>
          </li>
        ))}

        {isAdmin && (
          <>
            <li className="pt-3 pb-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
                Admin
              </p>
            </li>
            {adminLinks.map(({ href, label, icon: Icon, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors"
                >
                  <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {description}
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground shrink-0" />
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </>
  );
}
