import "server-only";
import { prisma } from "./prisma";
import { anotarEvento } from "./historial-pedido";
import {
  avisarPagoConfirmado,
  avisarEnviado,
  type PedidoParaAviso,
} from "./avisos-pedido";
import { buildTrackingUrl } from "./share-message";
import type { EstadoPedido } from "./estados-pedido";

/**
 * Mandar el correo que corresponde cuando un pedido cambia de estado.
 *
 * ── Solo dos estados avisan ──
 *
 * PAGADO y ENVIADO. Los demás no le dicen nada útil a quien compró:
 * «empaquetado» es información de taller, y «entregado» llega cuando la
 * caja ya está en sus manos — un correo diciéndoselo es ruido.
 *
 * ── Por qué no se manda dos veces ──
 *
 * Un estado se puede mover y volver a mover: se marca enviado, se ve que
 * era otro pedido, se deshace, se vuelve a marcar. Sin comprobar nada,
 * cada vuelta le manda otro correo a la misma persona diciendo lo mismo,
 * y tres «tu pedido va en camino» seguidos parecen un sistema roto.
 *
 * Se mira el historial del propio pedido, que ya guarda qué correos
 * salieron. Sin tabla nueva y sin banderas.
 */

/** Qué correo corresponde a cada estado. Lo que no está aquí, no avisa. */
const CORREO_DE_ESTADO: Partial<Record<EstadoPedido, string>> = {
  PAID: "pago",
  SHIPPED: "envio",
};

export async function avisarDelCambioDeEstado(
  orderId: string,
  estado: EstadoPedido
): Promise<void> {
  const clase = CORREO_DE_ESTADO[estado];
  if (!clase) return;

  try {
    // ¿Ya salió este correo para este pedido?
    const yaSalio = await prisma.eventoDePedido.findFirst({
      where: { orderId, tipo: "CORREO", mensaje: clase, detalle: "ok" },
      select: { id: true },
    });
    if (yaSalio) return;

    const pedido = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        publicToken: true,
        total: true,
        subtotal: true,
        shippingCost: true,
        trackingNumber: true,
        customer: { select: { name: true, email: true, phone: true } },
        carrier: { select: { name: true, trackingUrlTemplate: true } },
        shippingAddress: { select: { city: true, province: true } },
        items: { select: { itemName: true, quantity: true, lineTotal: true } },
      },
    });

    /*
      Sin correo no hay nada que mandar, y no es un fallo: los pedidos que
      la dueña carga a mano desde el panel muchas veces no lo tienen —los
      recibió por WhatsApp— y ahí el aviso lo da ella por el mismo sitio.
    */
    if (!pedido?.publicToken || !pedido.customer.email) return;

    const p: PedidoParaAviso = {
      orderNumber: pedido.orderNumber,
      publicToken: pedido.publicToken,
      total: pedido.total,
      subtotal: pedido.subtotal,
      shippingCost: pedido.shippingCost,
      clienteNombre: pedido.customer.name,
      clienteEmail: pedido.customer.email,
      clienteTelefono: pedido.customer.phone,
      ciudad: pedido.shippingAddress?.city ?? "",
      provincia: pedido.shippingAddress?.province ?? "",
      items: pedido.items,
    };

    const salio =
      estado === "PAID"
        ? await avisarPagoConfirmado(p)
        : await avisarEnviado(p, {
            transportadora: pedido.carrier?.name ?? null,
            guia: pedido.trackingNumber,
            enlaceGuia: buildTrackingUrl(
              pedido.carrier?.trackingUrlTemplate ?? null,
              pedido.trackingNumber
            ),
          });

    await anotarEvento(orderId, "CORREO", {
      mensaje: clase,
      detalle: salio ? "ok" : "fallo",
    });
  } catch (e) {
    /*
      Nunca lanza. Esto acompaña a un cambio de estado que ya ocurrió y
      que importa mucho más que su aviso: si el correo revienta, el pedido
      sigue enviado y la etiqueta sigue impresa.
    */
    console.error("[avisos] No se pudo avisar del cambio de estado", orderId, estado, e);
  }
}
