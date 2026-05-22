import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PACKED: "Empaquetado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

const statusVariant = (s: string) => {
  switch (s) {
    case "PENDING":
      return "secondary";
    case "PAID":
    case "PACKED":
      return "default";
    case "SHIPPED":
    case "DELIVERED":
      return "outline";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
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
        description="Todos los pedidos registrados."
        actions={
          <Button asChild>
            <Link href="/pedidos/nuevo">
              <PlusCircle className="size-4" /> Nuevo pedido
            </Link>
          </Button>
        }
      />

      {orders.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">Aún no tienes pedidos.</p>
          <Button asChild>
            <Link href="/pedidos/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Transportadora</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    <Link href={`/pedidos/${o.id}`} className="hover:underline font-medium">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>{o.customer.name}</TableCell>
                  <TableCell className="text-xs">
                    {o.carrier?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {o._count.items}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(o.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(o.status) as never}>
                      {statusLabel[o.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
