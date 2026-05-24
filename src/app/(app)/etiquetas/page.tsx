import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StandalonePrint } from "./standalone-print";

export const dynamic = "force-dynamic";

export default async function EtiquetasPage() {
  const [products, agentEnabledSetting] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, labelPdfUrl: { not: null } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        sku: true,
        name: true,
        labelPdfUrl: true,
      },
    }),
    prisma.setting.findUnique({ where: { key: "print_agent_enabled" } }),
  ]);

  const agentEnabled = agentEnabledSetting?.value === "true";

  return (
    <>
      <PageHeader
        title="Imprimir etiquetas"
        description="Imprime cualquier etiqueta sin necesidad de un pedido. Útil para reponer rollos o etiquetas extra."
      />

      <StandalonePrint
        products={products.map((p) => ({ id: p.id, sku: p.sku, name: p.name }))}
        agentEnabled={agentEnabled}
      />
    </>
  );
}
