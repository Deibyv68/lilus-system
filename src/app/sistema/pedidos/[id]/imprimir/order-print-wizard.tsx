"use client";

import { useRouter } from "next/navigation";
import { PrintStepWizard } from "@/app/sistema/pedidos/nuevo/print-step-wizard";

export function OrderPrintWizard({
  orderId,
  orderNumber,
  productionUnits,
  packCount,
  agentEnabled,
}: {
  orderId: string;
  orderNumber: string;
  productionUnits: { id: string; productName: string; batchCode: string }[];
  packCount: number;
  agentEnabled: boolean;
}) {
  const router = useRouter();
  return (
    <PrintStepWizard
      orderId={orderId}
      orderNumber={orderNumber}
      productionUnits={productionUnits}
      packCount={packCount}
      agentEnabled={agentEnabled}
      onFinish={() => router.push(`/sistema/pedidos/${orderId}`)}
    />
  );
}
