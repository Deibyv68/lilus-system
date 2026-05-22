"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  ShoppingCart,
  Package,
  MoreHorizontal,
  PlusCircle,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/pedidos",
    label: "Pedidos",
    icon: ShoppingCart,
    match: (p: string) => p.startsWith("/pedidos") && !p.startsWith("/pedidos/nuevo"),
  },
  // El centro lleva el FAB
  {
    href: "/productos",
    label: "Catálogo",
    icon: Package,
    match: (p: string) => p.startsWith("/productos") || p.startsWith("/packs"),
  },
  {
    href: "/mas",
    label: "Más",
    icon: MoreHorizontal,
    match: (p: string) =>
      p.startsWith("/clientes") ||
      p.startsWith("/envios") ||
      p.startsWith("/configuracion") ||
      p.startsWith("/mas"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Ocultar en la página de creación de pedido (tiene su propia bottom bar)
  const hide = pathname === "/pedidos/nuevo";
  if (hide) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-40 shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 items-end">
        {/* Items 1 y 2 */}
        {navItems.slice(0, 2).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        {/* FAB central — Nuevo pedido */}
        <div className="flex justify-center -mt-5">
          <Link
            href="/pedidos/nuevo"
            aria-label="Nuevo pedido"
            className="flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
          >
            <PlusCircle className="size-7" />
          </Link>
        </div>

        {/* Items 3 y 4 */}
        {navItems.slice(2).map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof navItems)[number];
  pathname: string;
}) {
  const Icon = item.icon;
  const active = item.match(pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{item.label}</span>
    </Link>
  );
}
