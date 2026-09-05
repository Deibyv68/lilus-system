import { NextResponse } from "next/server";
import { comprobanteDelPedido } from "@/lib/comprobante-de-compra";

/**
 * El comprobante de compra, como archivo descargable.
 *
 * ── Por qué cuelga de /pedido y no de /api ──
 *
 * Por dos puertas que ya existen y que se cerrarían encima de él.
 *
 * La primera es `SOLO_TIENDA`: cuando ese interruptor está puesto, el
 * proxy responde 404 a todo `/api` salvo la subida de comprobantes. Un
 * PDF en `/api/...` desaparecería justo en el modo en el que la tienda
 * es lo único que queda vivo — que es cuando más falta hace.
 *
 * La segunda es Cloudflare Access, que pide login para `/sistema` y
 * `/login`. La clienta no tiene cuenta ahí ni debe tenerla.
 *
 * Bajo `/pedido/<token>/` el archivo hereda exactamente el mismo permiso
 * que la página que lo ofrece: quien tiene el enlace, lo tiene; quien no,
 * no. Un secreto en vez de dos.
 */

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const comprobante = await comprobanteDelPedido(token);

  if (!comprobante) return new NextResponse("No encontrado", { status: 404 });

  return new NextResponse(new Uint8Array(comprobante.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${comprobante.nombreDeArchivo}"`,
      /* Un comprobante cambia de «pendiente» a «pagado». Nadie debe
         servir una copia guardada de la versión anterior. */
      "Cache-Control": "no-store",
    },
  });
}
