import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { leerComprobante } from "@/lib/comprobantes";

export const dynamic = "force-dynamic";

/**
 * Sirve un comprobante de pago, a quien tenga derecho a verlo.
 *
 * ── Quiénes tienen derecho ──
 *
 * Dos, y por caminos distintos:
 *
 *   · Quien tiene sesión en el panel. Es la dueña mirando si le pagaron.
 *   · Quien trae el `token` del pedido. Es la clienta viendo el
 *     comprobante que ella misma acaba de subir, en su página.
 *
 * Nadie más. Un comprobante lleva el nombre de quien pagó, su banco y su
 * número de cuenta: es el documento más sensible que pasa por este
 * sistema.
 *
 * ── Por qué no basta con un nombre de archivo imposible de adivinar ──
 *
 * Porque el archivo no está en `public`, así que no hay dirección directa
 * que adivinar — esta ruta es la única puerta. Ver `src/lib/comprobantes.ts`
 * para el porqué de guardarlos fuera.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const comprobante = await prisma.comprobanteDePago.findUnique({
    where: { id },
    select: {
      archivo: true,
      tipo: true,
      order: { select: { publicToken: true } },
    },
  });

  if (!comprobante) return new NextResponse(null, { status: 404 });

  const token = req.nextUrl.searchParams.get("token");
  const esDelPedido =
    Boolean(token) && token === comprobante.order.publicToken;

  if (!esDelPedido) {
    const usuario = await currentUser();
    /*
      404 y no 403 a quien no tiene derecho.

      Un 403 confirmaría que ese comprobante existe. Quien esté probando
      identificadores al azar no debería poder distinguir «no existe» de
      «existe pero no es tuyo».
    */
    if (!usuario) return new NextResponse(null, { status: 404 });
  }

  const archivo = await leerComprobante(comprobante.archivo);
  if (!archivo) return new NextResponse(null, { status: 404 });

  return new NextResponse(Readable.toWeb(archivo.flujo) as ReadableStream, {
    headers: {
      "content-type": comprobante.tipo,
      "content-length": String(archivo.bytes),
      /*
        `no-store` a propósito: un comprobante no debe quedarse en la
        caché de un proxy ni del navegador de un locutorio.
      */
      "cache-control": "no-store, private",
      // Se muestra en la página, no se descarga.
      "content-disposition": "inline",
    },
  });
}
