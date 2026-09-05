import "server-only";
import { datosDelRecibo, identidadDelVendedor, datosDeContacto } from "./tienda";
import { buildComprobantePdf } from "./pdf-comprobante";

/**
 * El comprobante de compra de un pedido, listo para entregar.
 *
 * Existe para que haya un solo sitio donde se decide qué dice el
 * documento. Lo piden dos: la ruta que lo baja de la web y los correos que
 * lo mandan adjunto. Si cada uno armara sus datos por su lado, el día que
 * cambie una regla —cuándo cuenta como pagado, qué se considera confirmado—
 * quedaría cambiada en un sitio y no en el otro, y saldrían dos
 * comprobantes distintos del mismo pedido.
 *
 * Devuelve null si el pedido no existe. Nunca lanza: quien lo llama o está
 * sirviendo una descarga (y responde 404) o está mandando un correo, y ahí
 * un fallo al dibujar un PDF no puede llevarse por delante el aviso.
 */
export async function comprobanteDelPedido(
  token: string
): Promise<{ nombreDeArchivo: string; bytes: Uint8Array } | null> {
  try {
    const [pedido, vendedor, contacto] = await Promise.all([
      datosDelRecibo(token),
      identidadDelVendedor(),
      datosDeContacto(),
    ]);

    if (!pedido) return null;

    const pagado = pedido.comprobantes.reduce(
      (suma, c) => suma + (c.montoConfirmado ?? 0),
      0
    );
    /*
      En centavos para comparar. Sumar decimales en coma flotante da
      25,499999999999996 y un comprobante que dice «falta $0,00» es peor
      que uno que no dice nada. Es la misma cuenta que hace la página.
    */
    const faltanCentavos =
      Math.round(pedido.total * 100) - Math.round(pagado * 100);
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
      El nombre del archivo se limpia a mano porque va dentro de una
      cabecera HTTP y dentro del sobre de un correo. `orderNumber` sale de
      la base: una coma o un salto de línea ahí no rompen la descarga, la
      parten en dos cabeceras.
    */
    const nombreDeArchivo =
      `Comprobante-${pedido.orderNumber}`.replace(/[^A-Za-z0-9._-]/g, "-") +
      ".pdf";

    return { nombreDeArchivo, bytes };
  } catch (e) {
    console.error(`[comprobante] No se pudo armar el de «${token}»:`, e);
    return null;
  }
}
