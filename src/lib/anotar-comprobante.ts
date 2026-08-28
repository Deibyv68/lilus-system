import "server-only";
import path from "node:path";
import { after } from "next/server";
import { prisma } from "./prisma";
import { guardarComprobante, carpetaDeComprobantes } from "./comprobantes";
import { leerComprobanteConOcr } from "./leer-comprobante";

/**
 * Guardar un comprobante en un pedido y ponerlo a leer.
 *
 * ── Por qué vive aquí y no dentro de una acción ──
 *
 * Hay dos puertas: el cliente lo sube desde su página, y la dueña lo sube
 * desde el panel cuando se lo mandaron por WhatsApp. Si cada una hiciera
 * su propio guardado, el día que esto cambie —otro formato, otra lectura,
 * un aviso más— solo una de las dos lo tendría, y la otra se quedaría a
 * medias sin que nada fallara de forma visible.
 *
 * Lo que sí cambia entre las dos es quién puede y cuándo, y eso se queda
 * en cada acción, que es donde se decide.
 */

export type Anotado =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function anotarComprobante(
  orderId: string,
  archivo: unknown
): Promise<Anotado> {
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
      orderId,
      archivo: guardado.archivo,
      tipo: guardado.tipo,
      bytes: guardado.bytes,
    },
  });

  /*
    El OCR corre DESPUÉS de responder.

    Leer una imagen tarda entre cinco y quince segundos en la laptop que
    hace de servidor. Hacer esperar todo ese rato a quien acaba de subir
    el comprobante —mirando una pantalla que no dice nada— convertiría una
    mejora en una molestia.

    `after()` es de Next y existe justo para esto: la respuesta sale ya, y
    el trabajo sigue. Al recargar, la lectura está.

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
            bancoLeido: lectura.banco,
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

  return { ok: true, id: fila.id };
}
