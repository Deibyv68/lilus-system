import { prisma } from "@/lib/prisma";
import { conSesion, json } from "@/lib/auth-movil";
import { esperaDePago } from "@/lib/espera-de-pago";
import { etiquetaDeEstado } from "@/lib/estados-pedido";

export const dynamic = "force-dynamic";

/**
 * Los pedidos, para la pantalla nativa de la app.
 *
 * ── Por qué el aviso de pago se calcula aquí y no en el teléfono ──
 *
 * `esperaDePago()` cuenta contra las 48 horas de las condiciones de
 * compra. Si esa cuenta se hiciera en el teléfono, dependería del reloj
 * del teléfono: uno mal puesto —o en otra zona horaria— mostraría un
 * plazo distinto al que ve el panel para el mismo pedido. Se calcula
 * contra el reloj del servidor, que es el mismo para todos, y el
 * teléfono solo pinta lo que recibe.
 *
 * La app refresca al abrir y al bajar la lista, así que el texto se
 * mantiene fresco sin que el teléfono tenga que saber contar.
 *
 * ── Por qué se manda `estadoTexto` ya traducido ──
 *
 * Para que «Pendiente» y «Empaquetado» se escriban en un solo sitio. Si
 * la app tuviera su propia tabla de traducciones, el día que cambie una
 * palabra habría que acordarse de cambiarla en dos repositorios.
 */
export const GET = conSesion(async (req) => {
  const limite = Math.min(
    Number(new URL(req.url).searchParams.get("limite") ?? 30) || 30,
    100
  );

  const pedidos = await prisma.order.findMany({
    take: limite,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      source: true,
      trackingNumber: true,
      customer: { select: { name: true, phone: true } },
      carrier: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });

  const ahora = new Date();

  return json({
    ahora: ahora.toISOString(),
    pedidos: pedidos.map((p) => ({
      id: p.id,
      numero: p.orderNumber,
      estado: p.status,
      estadoTexto: etiquetaDeEstado(p.status),
      total: p.total,
      creadoEn: p.createdAt.toISOString(),
      origen: p.source,
      cliente: p.customer.name,
      telefono: p.customer.phone,
      transportadora: p.carrier?.name ?? null,
      guia: p.trackingNumber,
      items: p._count.items,
      espera: esperaDePago(p.status, p.createdAt, ahora),
    })),
  });
});
