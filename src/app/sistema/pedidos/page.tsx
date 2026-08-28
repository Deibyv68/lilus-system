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
    // `source` se muestra en la lista: ahora que la tienda crea pedidos
    // sola, hay que poder distinguir de un vistazo cuál llegó por la web
    // y está esperando que alguien revise la transferencia.
    include: {
      /*
        Teléfono, cédula y ciudad: los busca el filtro avanzado.

        Quien llama por teléfono casi nunca sabe el número de su pedido —
        sabe su nombre, o el número desde el que escribió. Sin estos
        campos el buscador solo encontraría por nombre, que es justo el
        dato que más se repite entre clientas.
      */
      customer: {
        select: {
          name: true,
          phone: true,
          contactPhone: true,
          cedula: true,
        },
      },
      shippingAddress: { select: { city: true } },
      carrier: { select: { name: true } },
      _count: { select: { items: true } },
      /*
        Los comprobantes, no su número.

        La etiqueta de la lista distingue el que espera revisión del que
        ya está comprobado, y esa diferencia no cabe en un contador. Son
        dos campos por comprobante y hay como mucho cinco por pedido.
      */
      comprobantes: {
        select: { aceptado: true, montoConfirmado: true },
      },
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
            <Link href="/sistema/pedidos/nuevo">
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
            <Link href="/sistema/pedidos/nuevo">Crear el primero</Link>
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
            source: o.source,
            customer: o.customer,
            ciudad: o.shippingAddress?.city ?? null,
            carrier: o.carrier ? { name: o.carrier.name } : null,
            _count: { items: o._count.items },
            comprobantes: o.comprobantes,
          }))}
        />
      )}
    </>
  );
}
