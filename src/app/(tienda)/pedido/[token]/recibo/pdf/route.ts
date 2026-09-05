import { NextResponse } from "next/server";
import {
  datosDelRecibo,
  identidadDelVendedor,
  datosDeContacto,
} from "@/lib/tienda";
import { buildComprobantePdf } from "@/lib/pdf-comprobante";

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

  const [pedido, vendedor, contacto] = await Promise.all([
    datosDelRecibo(token),
    identidadDelVendedor(),
    datosDeContacto(),
  ]);

  if (!pedido) return new NextResponse("No encontrado", { status: 404 });

  const pagado = pedido.comprobantes.reduce(
    (suma, c) => suma + (c.montoConfirmado ?? 0),
    0
  );
  /* En centavos, por lo mismo que en la página: sumar decimales sueltos
     deja «falta $0,00» en pedidos que están pagados enteros. */
  const faltanCentavos = Math.round(pedido.total * 100) - Math.round(pagado * 100);
  const estaPagado = faltanCentavos <= 0 && pedido.comprobantes.length > 0;

  const bytes = await buildComprobantePdf({
    orderNumber: pedido.orderNumber,
    fecha: pedido.createdAt,
    estado:
      pedido.status === "CANCELLED"
        ? "anulado"
        : estaPagado
          ? "pagado"
          : "pendiente",
    vendedor: {
      nombre: vendedor.nombre,
      cedula: vendedor.cedula,
      ciudad: vendedor.ciudad,
      email: vendedor.email,
      whatsapp: contacto.whatsappNumero,
    },
    comprador: {
      nombre: pedido.customer.name,
      cedula: pedido.customer.cedula,
      telefono: pedido.customer.phone,
      email: pedido.customer.email,
    },
    entrega: pedido.shippingAddress
      ? {
          direccion: pedido.shippingAddress.address,
          ciudad: pedido.shippingAddress.city,
          provincia: pedido.shippingAddress.province,
          referencia: pedido.shippingAddress.reference,
          transportadora: pedido.carrier?.name ?? null,
          guia: pedido.trackingNumber,
        }
      : null,
    items: pedido.items.map((i) => ({
      nombre: i.itemName,
      cantidad: i.quantity,
      precioUnitario: i.unitPrice,
      total: i.lineTotal,
    })),
    subtotal: pedido.subtotal,
    envio: pedido.shippingCost,
    total: pedido.total,
    pagado,
    falta: Math.max(0, faltanCentavos) / 100,
  });

  /*
    El nombre del archivo se limpia a mano. `orderNumber` sale de la base
    y termina dentro de una cabecera HTTP: una coma o un salto de línea
    ahí no rompen la descarga, la parten en dos cabeceras.
  */
  const nombre = `Comprobante-${pedido.orderNumber}`.replace(/[^A-Za-z0-9._-]/g, "-");

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre}.pdf"`,
      /* Un comprobante cambia de «pendiente» a «pagado». Nadie debe
         servir una copia guardada de la versión anterior. */
      "Cache-Control": "no-store",
    },
  });
}
