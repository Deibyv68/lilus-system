import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { PlusCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [orderCount, productCount, packCount, pendingOrders, recentOrders] =
    await Promise.all([
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.pack.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
    ]);

  const todaySales = await prisma.order.aggregate({
    _sum: { total: true },
    where: {
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      status: { not: "CANCELLED" },
    },
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen de tu operación de hoy."
        actions={
          <Button asChild>
            <Link href="/pedidos/nuevo">
              <PlusCircle className="size-4" /> Nuevo pedido
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Ventas hoy" value={formatCurrency(todaySales._sum.total ?? 0)} />
        <StatCard label="Pedidos pendientes" value={pendingOrders.toString()} />
        <StatCard label="Productos activos" value={productCount.toString()} />
        <StatCard label="Packs activos" value={packCount.toString()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay pedidos. Crea el primero desde el botón superior.
            </p>
          ) : (
            <ul className="divide-y">
              {recentOrders.map((o) => (
                <li
                  key={o.id}
                  className="py-3 flex items-center justify-between text-sm"
                >
                  <div>
                    <Link href={`/pedidos/${o.id}`} className="font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="text-muted-foreground ml-2">
                      {o.customer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{o.status}</Badge>
                    <span className="tabular-nums">{formatCurrency(o.total)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button variant="outline" asChild size="sm">
              <Link href="/pedidos">Ver todos los pedidos</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-8">
        Total histórico de pedidos: {orderCount}
      </p>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
