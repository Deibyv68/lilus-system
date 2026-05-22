export type ShareableOrder = {
  orderNumber: string;
  customerName: string;
  items: { quantity: number; itemName: string }[];
  total: number;
  shippingCost: number;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  address: {
    address: string;
    city: string;
    province: string;
    reference: string | null;
  } | null;
};

export function buildShipmentMessage(order: ShareableOrder): string {
  const lines: string[] = [];
  const firstName = order.customerName.split(" ")[0] ?? order.customerName;

  lines.push(`¡Hola ${firstName}! 🌸`);
  lines.push("");
  lines.push(`Tu pedido *${order.orderNumber}* ya fue enviado.`);
  lines.push("");

  lines.push("📦 *Contenido:*");
  for (const it of order.items) {
    lines.push(`• ${it.quantity}× ${it.itemName}`);
  }
  lines.push("");

  lines.push(`💰 *Total:* $${order.total.toFixed(2)}`);
  if (order.shippingCost > 0) {
    lines.push(`   (incluye envío $${order.shippingCost.toFixed(2)})`);
  }
  lines.push("");

  if (order.carrierName) {
    lines.push(`🚚 *${order.carrierName}*`);
    if (order.trackingNumber) {
      lines.push(`Guía: \`${order.trackingNumber}\``);
      if (order.trackingUrl) {
        lines.push(`Rastrea aquí: ${order.trackingUrl}`);
      }
    }
    lines.push("");
  }

  if (order.address) {
    lines.push("📍 *Dirección de entrega:*");
    lines.push(order.address.address);
    lines.push(`${order.address.city}, ${order.address.province}`);
    if (order.address.reference) {
      lines.push(`Ref: ${order.address.reference}`);
    }
    lines.push("");
  }

  lines.push("Gracias por elegir LILUS ✨");
  lines.push("_Cuidado natural · Hecho con amor_");

  return lines.join("\n");
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
