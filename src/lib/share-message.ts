export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PACKED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type ShareableOrder = {
  orderNumber: string;
  customerName: string;
  items: { quantity: number; itemName: string }[];
  total: number;
  shippingCost: number;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  /**
   * La página del pedido, con su enlace secreto.
   *
   * Es lo que convierte el mensaje en algo consultable: quien lo recibe
   * ya no tiene que preguntar «¿cómo va?» — abre y ve. Y desde ahí sube
   * su comprobante, que llega pegado al pedido correcto.
   */
  enlacePedido?: string | null;
  address: {
    address: string;
    city: string;
    province: string;
    reference: string | null;
  } | null;
};

// Devuelve el cuerpo del mensaje listo para enviar al cliente, ajustado al
// estado actual del pedido.
export function buildStatusMessage(
  order: ShareableOrder,
  status: OrderStatus
): string {
  const firstName = order.customerName.split(" ")[0] ?? order.customerName;
  const lines: string[] = [];

  // Intro según estado
  switch (status) {
    case "PENDING":
      lines.push(`¡Hola ${firstName}! 🌸`);
      lines.push("");
      lines.push(`Recibimos tu pedido *${order.orderNumber}* en LILUS.`);
      lines.push("Lo estamos procesando y te avisaremos en cada paso.");
      break;
    case "PAID":
      lines.push(`¡Hola ${firstName}! 🌸`);
      lines.push("");
      lines.push(
        `Confirmamos el pago de tu pedido *${order.orderNumber}*. ¡Gracias!`
      );
      lines.push("Comenzamos a preparar todo con cariño 💛");
      break;
    case "PACKED":
      lines.push(`¡Hola ${firstName}! 🌸`);
      lines.push("");
      lines.push(
        `Tu pedido *${order.orderNumber}* ya está empaquetado y listo para salir.`
      );
      lines.push("Te avisamos en cuanto vaya en camino.");
      break;
    case "SHIPPED":
      lines.push(`¡Hola ${firstName}! 🌸`);
      lines.push("");
      lines.push(`Tu pedido *${order.orderNumber}* ya fue enviado.`);
      break;
    case "DELIVERED":
      lines.push(`¡Hola ${firstName}! 🌸`);
      lines.push("");
      lines.push(`Tu pedido *${order.orderNumber}* fue entregado.`);
      lines.push("Esperamos que disfrutes cada producto LILUS ✨");
      lines.push("Si te animas, nos encantaría saber tu experiencia 💛");
      break;
    case "CANCELLED":
      lines.push(`Hola ${firstName}.`);
      lines.push("");
      lines.push(`Tu pedido *${order.orderNumber}* fue cancelado.`);
      lines.push(
        "Si fue un error o quieres más información, contáctanos directamente."
      );
      break;
  }
  lines.push("");

  // Contenido (todos menos cancelado)
  if (status !== "CANCELLED" && order.items.length > 0) {
    lines.push("📦 *Contenido:*");
    for (const it of order.items) {
      lines.push(`• ${it.quantity}× ${it.itemName}`);
    }
    lines.push("");
  }

  // Total (todos menos cancelado)
  if (status !== "CANCELLED") {
    lines.push(`💰 *Total:* $${order.total.toFixed(2)}`);
    if (order.shippingCost > 0) {
      lines.push(`   (incluye envío $${order.shippingCost.toFixed(2)})`);
    }
    lines.push("");
  }

  // Guía solo en SHIPPED / DELIVERED si existe
  if (
    (status === "SHIPPED" || status === "DELIVERED") &&
    order.carrierName &&
    order.trackingNumber
  ) {
    lines.push(`🚚 *${order.carrierName}*`);
    lines.push(`Guía: \`${order.trackingNumber}\``);
    if (order.trackingUrl) {
      lines.push(`Rastrea aquí: ${order.trackingUrl}`);
    }
    lines.push("");
  }

  // Dirección solo en SHIPPED (para confirmar adónde va)
  if (status === "SHIPPED" && order.address) {
    lines.push("📍 *Dirección de entrega:*");
    lines.push(order.address.address);
    lines.push(`${order.address.city}, ${order.address.province}`);
    if (order.address.reference) {
      lines.push(`Ref: ${order.address.reference}`);
    }
    lines.push("");
  }

  /*
    El enlace de seguimiento, en todos los estados menos cancelado.

    En «pendiente» es además donde se paga y donde se sube el
    comprobante, así que ahí va con otra frase: no es «mira cómo va», es
    «haz lo que falta».
  */
  if (order.enlacePedido && status !== "CANCELLED") {
    if (status === "PENDING") {
      lines.push("Aquí puedes pagar y subir tu comprobante:");
    } else {
      lines.push("Sigue tu pedido aquí:");
    }
    lines.push(order.enlacePedido);
    lines.push("");
  }

  // Cierre de marca (todos menos cancelado)
  if (status !== "CANCELLED") {
    lines.push("Gracias por elegir LILUS ✨");
    lines.push("_Cuidado natural · Hecho con amor_");
  }

  return lines.join("\n").trim();
}

/**
 * El mensaje para pedir lo que falta de un pago a medias.
 *
 * ── Por qué no es un estado más ──
 *
 * «Le falta pagar» no es un punto del recorrido de un pedido: es una
 * situación que puede darse estando pendiente y que se resuelve sin que
 * el pedido se mueva de sitio. Meterlo en `buildStatusMessage` obligaría
 * a inventar un estado que la base no tiene.
 *
 * ── Por qué el número va escrito y no calculado por quien lee ──
 *
 * Aquí se abona: la mitad hoy, el resto el viernes. Un mensaje que diga
 * «te falta completar» obliga a quien lo recibe a restar del total lo que
 * ya mandó, y a quien lo escribe a hacer la misma resta antes. Las dos
 * cuentas se equivocan, y la que se equivoca de más deja una venta a
 * medias que nadie reclama.
 *
 * Va también el enlace, porque desde ahí sube el segundo comprobante y
 * llega pegado al pedido correcto.
 */
export function buildSaldoMessage(
  order: ShareableOrder,
  saldo: { confirmado: number; falta: number }
): string {
  const firstName = order.customerName.split(" ")[0] ?? order.customerName;
  const lines: string[] = [];

  lines.push(`¡Hola ${firstName}! 🌸`);
  lines.push("");
  lines.push(
    `Recibimos tu transferencia de *$${saldo.confirmado.toFixed(2)}* ` +
      `para el pedido *${order.orderNumber}*. ¡Gracias!`
  );
  lines.push("");
  lines.push(
    `Para completarlo faltan *$${saldo.falta.toFixed(2)}* ` +
      `(el total es $${order.total.toFixed(2)}).`
  );
  lines.push("");

  if (order.enlacePedido) {
    lines.push("Puedes mandarlos cuando puedas y subir el comprobante aquí:");
    lines.push(order.enlacePedido);
  } else {
    lines.push(
      "Puedes mandarlos cuando puedas y pasarnos el comprobante por aquí."
    );
  }

  lines.push("");
  lines.push("Apenas lo confirmemos, empezamos a preparar tu pedido 💛");

  return lines.join("\n").trim();
}

// Devuelve un label corto para el botón de compartir, según estado.
export function statusShareLabel(status: OrderStatus): string {
  switch (status) {
    case "PENDING":
      return "Notificar pedido recibido";
    case "PAID":
      return "Confirmar pago al cliente";
    case "PACKED":
      return "Avisar que está empaquetado";
    case "SHIPPED":
      return "Enviar guía de tracking";
    case "DELIVERED":
      return "Mensaje de entrega";
    case "CANCELLED":
      return "Notificar cancelación";
  }
}

export function buildTrackingUrl(
  template: string | null,
  trackingNumber: string | null
): string | null {
  if (!template || !trackingNumber) return null;
  return template.replace("{tracking}", encodeURIComponent(trackingNumber));
}

/**
 * Convierte un teléfono local de Ecuador a formato internacional para wa.me.
 * "0999999999" -> "593999999999"
 * Si ya viene con +593 o 593, lo respeta.
 */
export function normalizePhoneForWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  if (digits.length < 8) return null;
  if (digits.startsWith("593")) return digits;
  if (digits.startsWith("0")) return "593" + digits.slice(1);
  return digits;
}

// Toma el teléfono apropiado para WhatsApp: contactPhone si existe, sino phone.
export function pickWhatsAppPhone(
  contactPhone: string | null | undefined,
  phone: string | null | undefined
): string | null {
  return contactPhone ?? phone ?? null;
}
