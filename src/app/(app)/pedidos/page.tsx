import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { OrderList } from "./order-list";
import { PlusCircle, ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      carrier: { select: { name: true } },
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
        <OrderList
          orders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            total: o.total,
            createdAt: o.createdAt.toISOString(),
            customer: { name: o.customer.name },
            carrier: o.carrier ? { name: o.carrier.name } : null,
            _count: { items: o._count.items },
          }))}
        />
      )}
    </>
  );
}
