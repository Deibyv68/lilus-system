import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Users,
  Truck,
  Settings,
  Boxes,
  ChevronRight,
  Printer,
} from "lucide-react";

const links = [
  { href: "/etiquetas", label: "Imprimir etiquetas", icon: Printer, description: "Imprimir etiquetas sueltas sin pedido" },
  { href: "/packs", label: "Packs", icon: Boxes, description: "Paquetes que agrupan productos" },
  { href: "/clientes", label: "Clientes", icon: Users, description: "Historial de personas que han comprado" },
  { href: "/envios", label: "Envíos", icon: Truck, description: "Zonas, transportadoras y tarifas" },
  { href: "/configuracion", label: "Configuración", icon: Settings, description: "Datos del remitente, marca" },
];

export default function MasPage() {
  return (
    <>
      <PageHeader title="Más opciones" />
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
      </ul>
    </>
  );
}
