import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import { OrderPrintWizard } from "./order-print-wizard";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, agentEnabledSetting] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        items: { select: { packId: true, quantity: true } },
        productionUnits: {
          select: { id: true, productName: true, batchCode: true },
          orderBy: { batchCode: "asc" },
        },
      },
    }),
    prisma.setting.findUnique({ where: { key: "print_agent_enabled" } }),
  ]);

  if (!order) notFound();

  const packCount = order.items
    .filter((i) => i.packId)
    .reduce((sum, i) => sum + i.quantity, 0);

  const agentEnabled = agentEnabledSetting?.value === "true";

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/pedidos/${order.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Volver al pedido
        </Link>
      </div>

      <PageHeader
        title="Imprimir etiquetas"
        description={`Pedido ${order.orderNumber}`}
      />

      <OrderPrintWizard
        orderId={order.id}
        orderNumber={order.orderNumber}
        productionUnits={order.productionUnits}
        packCount={packCount}
        agentEnabled={agentEnabled}
      />
    </>
  );
}
