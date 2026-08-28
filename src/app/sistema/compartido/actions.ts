"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { anotarArchivoGuardado } from "@/lib/anotar-comprobante";

/**
 * Enganchar al pedido elegido el comprobante que llegó al compartir.
 *
 * El archivo ya está en el disco desde `/api/compartir`: aquí solo se
 * decide de quién es.
 */

/*
  El nombre del archivo lo puso el servidor y es un UUID.

  Se comprueba antes de usarlo aunque venga de nuestra propia
  redirección: llega por la barra de direcciones, así que cualquiera
  puede escribir otra cosa. Sin esto, un `../../.env` en ese parámetro
  crearía una fila que sirve un archivo que no es un comprobante.
*/
const NOMBRE_VALIDO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic|pdf)$/;

export async function engancharCompartidoAction(
  orderId: string,
  archivo: string,
  tipo: string,
  bytes: number
) {
  await requireUser();

  if (!NOMBRE_VALIDO.test(archivo)) {
    return { ok: false as const, error: "Ese archivo no se puede usar" };
  }

  const pedido = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, publicToken: true },
  });
  if (!pedido) return { ok: false as const, error: "Ese pedido ya no existe" };

  const r = await anotarArchivoGuardado(pedido.id, {
    archivo,
    tipo,
    bytes: Number.isFinite(bytes) ? bytes : 0,
  });
  if (!r.ok) return { ok: false as const, error: r.error };

  revalidatePath(`/sistema/pedidos/${pedido.id}`);
  revalidatePath("/sistema/pedidos");
  revalidatePath("/sistema");
  if (pedido.publicToken) revalidatePath(`/pedido/${pedido.publicToken}`);

  /*
    Se va derecho al pedido.

    Quien acaba de compartir un comprobante quiere verlo puesto y decidir
    si el pago cuadra. Dejarla en la lista la obligaría a buscar otra vez
    el pedido que acaba de elegir.
  */
  redirect(`/sistema/pedidos/${pedido.id}`);
}
