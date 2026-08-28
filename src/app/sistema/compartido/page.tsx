import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ElegirPedido } from "./elegir-pedido";

export const dynamic = "force-dynamic";

/**
 * Elegir a qué pedido pertenece el comprobante que se acaba de compartir.
 *
 * ── De dónde viene ──
 *
 * De `/api/compartir`, que ya guardó el archivo. Aquí solo falta decir de
 * quién es.
 *
 * ── Qué pedidos se ofrecen ──
 *
 * Los pendientes primero y arriba del todo: un comprobante que llega es,
 * casi siempre, de algo que está sin cobrar. Pero salen también los
 * demás, porque la captura llega tarde a veces —después de haber dado el
 * pedido por pagado mirando el banco— y esconderlos obligaría a hacer el
 * viaje largo justo en el caso raro.
 */
export default async function Compartido({
  searchParams,
}: {
  searchParams: Promise<{
    archivo?: string;
    tipo?: string;
    bytes?: string;
    error?: string;
  }>;
}) {
  const { archivo, tipo, bytes, error } = await searchParams;

  if (error || !archivo || !tipo) {
    return (
      <>
        <PageHeader title="No se pudo recibir" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                {error === "sinarchivo"
                  ? "No llegó ninguna imagen. Comparte la foto del comprobante, no el texto del mensaje."
                  : error === "lectura"
                    ? "No se pudo leer lo que compartiste. Intenta de nuevo."
                    : (error ?? "Faltan datos del archivo compartido.")}
              </span>
            </p>
            <Button asChild variant="outline">
              <Link href="/sistema/pedidos">
                <ArrowLeft className="size-4" /> Ir a los pedidos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const pedidos = await prisma.order.findMany({
    /*
      Cancelados fuera: a un pedido que no existe no se le engancha un
      pago. Del resto se traen los últimos treinta — un comprobante que
      llega hoy no es de una venta de hace medio año.
    */
    where: { status: { not: "CANCELLED" } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      customer: { select: { name: true } },
      comprobantes: { select: { aceptado: true, montoConfirmado: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="¿De qué pedido es?"
        description="Llegó un comprobante desde otra app. Elige a cuál pertenece."
      />

      <ElegirPedido
        archivo={archivo}
        tipo={tipo}
        bytes={Number(bytes ?? 0)}
        pedidos={pedidos.map((p) => ({
          id: p.id,
          orderNumber: p.orderNumber,
          status: p.status,
          total: p.total,
          createdAt: p.createdAt.toISOString(),
          cliente: p.customer.name,
          comprobantes: p.comprobantes,
        }))}
      />
    </>
  );
}
