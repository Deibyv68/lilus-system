import "server-only";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Mover un pedido de estado.
 *
 * Vive aquí y no dentro de la server action del panel porque ahora hay
 * dos puertas: el panel web y la app de Android. Si cada una hiciera su
 * propio `update`, el día que un estado necesite un efecto más —marcar
 * una fecha, avisar a alguien, descontar stock— habría que acordarse de
 * añadirlo en los dos sitios, y la app se quedaría a medias sin que nada
 * fallara de forma visible.
 */

export const ESTADOS = [
  "PENDING",
  "PAID",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type EstadoPedido = (typeof ESTADOS)[number];

export function esEstadoValido(v: string): v is EstadoPedido {
  return (ESTADOS as readonly string[]).includes(v);
}

export type ResultadoCambio =
  | { ok: true }
  | { ok: false; error: string };

export async function cambiarEstadoDePedido(
  orderId: string,
  estado: EstadoPedido,
  opciones: { guia?: string | null } = {}
): Promise<ResultadoCambio> {
  const guia = opciones.guia?.trim();

  if (guia !== undefined && guia.length > 60) {
    return { ok: false, error: "La guía es demasiado larga" };
  }

  const existe = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!existe) return { ok: false, error: "Ese pedido ya no existe" };

  const data: {
    status: EstadoPedido;
    shippedAt?: Date;
    trackingNumber?: string;
  } = { status: estado };

  /*
    `shippedAt` se pone al pasar a ENVIADO y no se toca al volver atrás.

    Si alguien se equivoca de estado y regresa el pedido, borrar la fecha
    perdería cuándo salió de verdad. Es un dato de lo que pasó, no del
    estado actual.
  */
  if (estado === "SHIPPED") data.shippedAt = new Date();
  if (guia) data.trackingNumber = guia;

  await prisma.order.update({ where: { id: orderId }, data });

  revalidatePath("/sistema/pedidos");
  revalidatePath(`/sistema/pedidos/${orderId}`);
  revalidatePath("/sistema");

  return { ok: true };
}
