"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardarComprobante, carpetaDeComprobantes } from "@/lib/comprobantes";
import { leerComprobanteConOcr } from "@/lib/leer-comprobante";
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

  const archivo = formData.get("comprobante");
  if (!(archivo instanceof File)) {
    return { ok: false, error: "Elige una foto o un PDF" };
  }

  let guardado;
  try {
    guardado = await guardarComprobante(archivo);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const fila = await prisma.comprobanteDePago.create({
    data: {
      orderId: pedido.id,
      archivo: guardado.archivo,
      tipo: guardado.tipo,
      bytes: guardado.bytes,
    },
  });

  /*
    El OCR corre DESPUÉS de responder.

    Leer una imagen tarda entre cinco y quince segundos en la laptop que
    hace de servidor. Hacer esperar todo ese rato a quien acaba de subir
    su comprobante —mirando una pantalla que no dice nada— convertiría
    una mejora en una molestia.

    `after()` es de Next y existe justo para esto: la respuesta sale ya, y
    el trabajo sigue. Cuando la dueña abra el pedido, la lectura estará.

    Los PDF se saltan: Tesseract lee imágenes, no documentos. Sacar las
    páginas de un PDF primero es otra dependencia y otro rato de proceso,
    y los PDF son la minoría.
  */
  if (guardado.tipo !== "application/pdf") {
    after(async () => {
      try {
        const lectura = await leerComprobanteConOcr(
          path.join(carpetaDeComprobantes(), guardado.archivo)
        );
        if (!lectura) return;

        await prisma.comprobanteDePago.update({
          where: { id: fila.id },
          data: {
            montoLeido: lectura.monto,
            numeroLeido: lectura.numero,
            fechaLeida: lectura.fecha,
            textoLeido: lectura.texto,
            leidoEn: new Date(),
          },
        });
      } catch (e) {
        // Que el OCR falle no puede tocar el comprobante, que ya está a
        // salvo. Se queda sin lectura y la dueña mira la imagen, que es
        // lo que hacía antes de que esto existiera.
        console.error("[ocr] Falló la lectura en segundo plano:", e);
      }
    });
  }

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
