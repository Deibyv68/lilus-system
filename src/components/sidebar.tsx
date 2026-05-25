"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Truck,
  Settings,
  PlusCircle,
  Printer,
  LogOut,
  UserCog,
} from "lucide-react";
import { logoutAction } from "@/app/login/actions";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/pedidos/nuevo",
    label: "Nuevo pedido",
    icon: PlusCircle,
    accent: true,
  },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/packs", label: "Packs", icon: Boxes },
  { href: "/etiquetas", label: "Imprimir etiquetas", icon: Printer },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/envios", label: "Envíos", icon: Truck },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

const adminNav = [
  { href: "/configuracion/usuarios", label: "Usuarios", icon: UserCog },
];

export function Sidebar({
  user,
}: {
  user: { name: string; role: string };
}) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-5 border-b flex items-center gap-3">
        <Image
          src="/brand/lilus-logo.png"
          alt="LILUS"
          width={48}
          height={48}
          priority
          className="rounded-full shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight leading-none">
            LILUS
          </h1>
          <p className="text-[11px] italic text-muted-foreground mt-1">
            Ilumina tu belleza
          </p>
        </div>
      </div>

      <nav className="p-2 flex-1 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, accent }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "hover:bg-sidebar-accent",
                accent && !active && "border border-dashed"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}

        {user.role === "admin" && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-3">
                Admin
              </p>
            </div>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t space-y-2">
        <div className="px-2">
          <p className="text-xs font-semibold truncate">{user.name}</p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {user.role === "admin" ? "Administrador" : "Usuario"}
          </p>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
          >
            <LogOut className="size-3.5" /> Cerrar sesión
          </Button>
        </form>
      </div>
    </aside>
  );
}
