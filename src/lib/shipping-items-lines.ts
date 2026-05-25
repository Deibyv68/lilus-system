/**
 * Construye la lista de líneas que se imprimen en la sección CONTENIDO de
 * la etiqueta de envío. Para cada pack, expande los productos que lleva
 * adentro como sub-líneas indentadas.
 */
export function buildShippingItemsLines(
  items: Array<{
    quantity: number;
    itemName: string;
    productId: string | null;
    packId: string | null;
    pack: {
      items: Array<{
        quantity: number;
        product: { name: string; shortName: string | null };
      }>;
    } | null;
  }>
): { text: string; level: 0 | 1 }[] {
  const lines: { text: string; level: 0 | 1 }[] = [];

  for (const it of items) {
    // Línea principal
    lines.push({
      text: `${it.quantity}× ${it.itemName}`,
      level: 0,
    });

    // Si es un pack, agregar sub-líneas con los productos
    if (it.packId && it.pack) {
      for (const pi of it.pack.items) {
        const productName = pi.product.shortName ?? pi.product.name;
        // Multiplicamos por la cantidad del pack en el pedido
        const totalQty = pi.quantity * it.quantity;
        lines.push({
          text: `${totalQty}× ${productName}`,
          level: 1,
        });
      }
    }
  }

  return lines;
}
