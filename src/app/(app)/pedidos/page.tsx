import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PlusCircle, ChevronRight, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PACKED: "Empaquetado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  PAID: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  PACKED: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      carrier: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Pedidos"
        description={
          orders.length > 0
            ? `${orders.length} pedido${orders.length === 1 ? "" : "s"} registrado${orders.length === 1 ? "" : "s"}`
            : "Aún sin pedidos"
        }
        actions={
          <Button asChild size="lg" className="h-11">
            <Link href="/pedidos/nuevo">
              <PlusCircle className="size-4" /> Nuevo
            </Link>
          </Button>
        }
      />

      {orders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <ShoppingCart className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            Aún no tienes pedidos registrados.
          </p>
          <Button asChild size="lg">
            <Link href="/pedidos/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/pedidos/${o.id}`}
                className="block rounded-2xl border bg-card p-4 hover:bg-accent active:scale-[0.99] transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate leading-tight">
                      {o.customer.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {o.orderNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold tabular-nums leading-tight">
                      {formatCurrency(o.total)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {o._count.items} {o._count.items === 1 ? "ítem" : "ítems"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        statusColor[o.status] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel[o.status] ?? o.status}
                    </span>
                    {o.carrier && (
                      <Badge variant="outline" className="text-[10px]">
                        {o.carrier.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <span className="hidden sm:inline">
                      {formatDateTime(o.createdAt)}
                    </span>
                    <span className="sm:hidden">
                      {new Intl.DateTimeFormat("es-EC", {
                        day: "2-digit",
                        month: "short",
                      }).format(o.createdAt)}
                    </span>
                    <ChevronRight className="size-4" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
