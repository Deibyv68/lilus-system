import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/guard";
import { leerComprobante } from "@/lib/comprobantes";

export const dynamic = "force-dynamic";

/**
 * Sirve un comprobante que todavía no pertenece a ningún pedido.
 *
 * ── Por qué hace falta otra ruta ──
 *
 * `/api/comprobante/[id]` sirve por el id de la fila en la base. Un
 * archivo recién compartido desde WhatsApp aún no tiene fila —se crea al
 * elegir el pedido— así que no hay id que pedir, y sin esta ruta la
 * pantalla de elegir no podría enseñar lo que se está a punto de
 * enganchar.
 *
 * ── Quién puede ──
 *
 * Solo con sesión del panel, y a nadie más. Es un documento bancario con
 * el nombre y la cuenta de quien pagó.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ archivo: string }> }
) {
  const usuario = await currentUser();
  // 404 y no 403, por lo mismo que en la ruta de al lado: un 403
  // confirmaría que ese archivo existe.
  if (!usuario) return new NextResponse(null, { status: 404 });

  const { archivo } = await params;

  /*
    El nombre tiene que ser uno de los que genera el servidor.

    `leerComprobante` ya rechaza rutas con carpetas, pero aquí se exige
    además la forma exacta: un UUID con su extensión. Así ni siquiera se
    intenta abrir algo que nunca pudimos haber escrito.
  */
  const valido =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|heic|pdf)$/.test(
      archivo
    );
  if (!valido) return new NextResponse(null, { status: 404 });

  const encontrado = await leerComprobante(archivo);
  if (!encontrado) return new NextResponse(null, { status: 404 });

  const tipos: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    pdf: "application/pdf",
  };
  const extension = archivo.split(".").pop() ?? "";

  return new NextResponse(Readable.toWeb(encontrado.flujo) as ReadableStream, {
    headers: {
      "content-type": tipos[extension] ?? "application/octet-stream",
      "content-length": String(encontrado.bytes),
      "cache-control": "no-store, private",
      "content-disposition": "inline",
    },
  });
}
