import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import { BatchPrintWizard } from "./batch-print-wizard";

export const dynamic = "force-dynamic";

export default async function BatchPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = (params.ids ?? "").split(",").filter(Boolean);

  return (
    <>
      <div className="mb-4">
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Pedidos
        </Link>
      </div>

      <PageHeader
        title="Impresión por lote"
        description={
          ids.length > 0
            ? `Imprimiendo etiquetas de ${ids.length} pedido${ids.length === 1 ? "" : "s"} agrupadas por tipo`
            : "Sin pedidos seleccionados"
        }
      />

      {ids.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <p className="text-muted-foreground mb-4">
            No seleccionaste pedidos. Ve a la lista, marca los que quieres
            imprimir juntos y vuelve.
          </p>
          <Link
            href="/pedidos"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            <ArrowLeft className="size-4" /> Ir a pedidos
          </Link>
        </div>
      ) : (
        <BatchPrintWizard orderIds={ids} />
      )}
    </>
  );
}
