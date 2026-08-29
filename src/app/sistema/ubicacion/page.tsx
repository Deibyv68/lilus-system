import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leerPunto } from "@/lib/punto-de-maps";
import { ElegirDondeVaLaUbicacion } from "./elegir";

export const dynamic = "force-dynamic";

/**
 * La ubicación que llega al abrirla «con» LILUS.
 *
 * ── De dónde viene ──
 *
 * De tocar una ubicación en WhatsApp y elegir abrirla con esta app.
 * Android manda una dirección `geo:` y el manifiesto declara que sabemos
 * recibirla.
 *
 * WhatsApp no deja compartir una ubicación como texto —eso ya se probó—
 * pero sí abrirla. Es la misma idea que el comprobante compartido, por la
 * otra puerta.
 *
 * ── Qué hace con ella ──
 *
 * La pega al pedido que se elija. Solo el punto: la zona y el costo del
 * envío no se tocan, porque ese pedido ya tiene un total que la clienta
 * ya vio. Ver la acción.
 */
export default async function Ubicacion({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  const { g } = await searchParams;
  const punto = g ? leerPunto(decodeURIComponent(g)) : null;

  if (!punto) {
    return (
      <>
        <PageHeader title="No se entendió esa ubicación" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="flex items-start gap-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <span>
                {g
                  ? "Lo que llegó no traía coordenadas dentro de Ecuador. Puedes marcar el punto a mano en el pedido."
                  : "No llegó ninguna ubicación."}
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
      Cancelados fuera, y solo los que tienen dirección: a un pedido sin
      dirección de envío no hay dónde pegarle un punto.
    */
    where: { status: { not: "CANCELLED" }, shippingAddressId: { not: null } },
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
        title="¿De qué pedido es esta ubicación?"
        description="Llegó desde otra app. Elige a cuál pertenece."
      />

      <ElegirDondeVaLaUbicacion
        lat={punto.lat}
        lng={punto.lng}
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
