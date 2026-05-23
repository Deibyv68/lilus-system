import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { PlusCircle, ShoppingCart, Package, Boxes } from "lucide-react";
import { AgentStatusBadge } from "@/components/agent-status-badge";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  PACKED: "Empaquetado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export default async function DashboardPage() {
  const [productCount, packCount, pendingOrders, recentOrders, todaySales] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.pack.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          status: { not: "CANCELLED" },
        },
      }),
    ]);

  return (
    <div className="space-y-5">
      {/* Indicador de estado de la impresora — verifica antes de crear pedido */}
      <AgentStatusBadge />

      {/* CTA principal — visible al entrar */}
      <Link
        href="/pedidos/nuevo"
        className="block rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 shadow-lg active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-white/15 flex items-center justify-center shrink-0">
            <PlusCircle className="size-8" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider opacity-90">
              Crear ahora
            </p>
            <p className="text-2xl font-bold leading-tight">Nuevo pedido</p>
            <p className="text-xs opacity-90 mt-0.5">
              Recibiste un pedido por WhatsApp, Instagram u otro
            </p>
          </div>
        </div>
      </Link>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Ventas hoy"
          value={formatCurrency(todaySales._sum.total ?? 0)}
        />
        <StatCard
          label="Pendientes"
          value={pendingOrders.toString()}
          highlight={pendingOrders > 0}
        />
      </div>

      {/* Pedidos recientes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Pedidos recientes</h2>
          <Link
            href="/pedidos"
            className="text-xs text-primary font-medium hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aún no tienes pedidos.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/pedidos/${o.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border bg-card hover:bg-accent active:scale-[0.99] transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{o.customer.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {o.orderNumber}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {statusLabel[o.status] ?? o.status}
                    </Badge>
                    <span className="text-sm font-bold tabular-nums">
                      {formatCurrency(o.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="text-lg font-bold mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickLink href="/pedidos" icon={ShoppingCart} label="Pedidos" />
          <QuickLink
            href="/productos"
            icon={Package}
            label="Productos"
            badge={productCount}
          />
          <QuickLink href="/packs" icon={Boxes} label="Packs" badge={packCount} />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        highlight
          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900"
          : "bg-card border"
      }`}
    >
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-2xl font-bold mt-1 tabular-nums ${
          highlight ? "text-amber-700 dark:text-amber-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-4 rounded-xl border bg-card hover:bg-accent active:scale-95 transition-all"
    >
      <Icon className="size-6 mb-1.5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
      {badge !== undefined && (
        <span className="text-[10px] text-muted-foreground mt-0.5">
          {badge}
        </span>
      )}
    </Link>
  );
}
