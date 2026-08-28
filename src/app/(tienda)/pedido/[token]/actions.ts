"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { anotarComprobante } from "@/lib/anotar-comprobante";
import { avisarComprobante } from "@/lib/avisos-push";

/**
 * Subir el comprobante desde la página del pedido.
 *
 * ── Quién puede ──
 *
 * Quien tenga el enlace de ese pedido. No hay login ni cuentas: el token
 * de 24 bytes al azar que va en el correo ES la llave, igual que para ver
 * el estado.
 *
 * Y el token no solo autoriza: identifica. Por eso el comprobante no
 * puede terminar en el pedido equivocado — se sube desde la página de un
 * pedido concreto, no desde un formulario suelto donde haya que decir a
 * cuál pertenece.
 *
 * ── Por qué solo mientras está pendiente ──
 *
 * Después de confirmado el pago, subir otro comprobante no significa
 * nada y solo confunde a quien revisa. Si alguien se equivocó y hay que
 * corregir, eso se arregla hablando, no acumulando archivos.
 */

const MAXIMO_POR_PEDIDO = 5;

export type ResultadoSubida =
  | { ok: true }
  | { ok: false; error: string };

export async function subirComprobanteAction(
  token: string,
  formData: FormData
): Promise<ResultadoSubida> {
  if (!token) return { ok: false, error: "Enlace inválido" };

  const pedido = await prisma.order.findUnique({
    where: { publicToken: token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customer: { select: { name: true } },
      _count: { select: { comprobantes: true } },
    },
  });

  if (!pedido) return { ok: false, error: "No encontramos ese pedido" };

  if (pedido.status !== "PENDING") {
    return {
      ok: false,
      error: "Este pedido ya está confirmado. No hace falta subir nada más.",
    };
  }

  if (pedido._count.comprobantes >= MAXIMO_POR_PEDIDO) {
    return {
      ok: false,
      error:
        "Ya subiste varios comprobantes para este pedido. Escríbenos por " +
        "WhatsApp si algo no cuadra.",
    };
  }

  const anotado = await anotarComprobante(
    pedido.id,
    formData.get("comprobante")
  );
  if (!anotado.ok) return anotado;

  /*
    El aviso al teléfono va después de guardar, y su fallo no se propaga.

    Si Firebase está caído, el comprobante ya está a salvo en la base: lo
    peor que pasa es que la dueña se entere al abrir el panel en vez de
    en el momento. Al revés —perder el comprobante porque no se pudo
    avisar— sería absurdo.
  */
  try {
    await avisarComprobante({
      orderNumber: pedido.orderNumber,
      clienteNombre: pedido.customer.name,
    });
  } catch (e) {
    console.error("[comprobante] No se pudo avisar:", e);
  }

  revalidatePath(`/pedido/${token}`);
  return { ok: true };
}
