"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/schemas";
import {
  createOrderWithNumber,
  buildProductionUnits,
  type ProductoParaEtiqueta,
} from "@/lib/order-utils";
import { requireUser } from "@/lib/guard";
import {
  cambiarEstadoDePedido,
  type EstadoPedido,
} from "@/lib/cambiar-estado";

type CreateOrderPayload = {
  customer: {
    name: string;
    cedula?: string;
    phone?: string;
    email?: string;
  };
  address: {
    province: string;
    city: string;
    address: string;
    reference?: string;
    zoneId: string;
    /*
      El punto del mapa, si se pudo conseguir.

      Opcional a propósito: un pedido dictado por teléfono puede no
      tenerlo, y exigirlo bloquearía la venta por un dato que mejora el
      reparto pero no lo condiciona.
    */
    lat?: number | null;
    lng?: number | null;
  };
  carrierId: string;
  shippingCost: number;
  notes?: string;
  source?: string;
  items: { kind: "product" | "pack"; refId: string; quantity: number }[];
};

export async function createOrderAction(payload: CreateOrderPayload) {
  await requireUser();

  const parsed = orderSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  // Cargar productos / packs reales para precios + componentes
  const productIds = data.items.filter((i) => i.kind === "product").map((i) => i.refId);
  const packIds = data.items.filter((i) => i.kind === "pack").map((i) => i.refId);

  const [products, packs] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),
    prisma.pack.findMany({
      where: { id: { in: packIds } },
      include: { items: { include: { product: true } } },
    }),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const packMap = new Map(packs.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData: Array<{
    productId?: string;
    packId?: string;
    itemName: string;
    itemSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];

  for (const it of data.items) {
    if (it.kind === "product") {
      const p = productMap.get(it.refId);
      if (!p) return { ok: false as const, error: "Producto no encontrado" };
      const line = p.price * it.quantity;
      subtotal += line;
      orderItemsData.push({
        productId: p.id,
        itemName: p.name,
        itemSku: p.sku,
        quantity: it.quantity,
        unitPrice: p.price,
        lineTotal: line,
      });
    } else {
      const pk = packMap.get(it.refId);
      if (!pk) return { ok: false as const, error: "Pack no encontrado" };
      const line = pk.price * it.quantity;
      subtotal += line;
      orderItemsData.push({
        packId: pk.id,
        itemName: pk.name,
        itemSku: pk.sku,
        quantity: it.quantity,
        unitPrice: pk.price,
        lineTotal: line,
      });
    }
  }

  const total = subtotal + data.shippingCost;

  // Una unidad física por cada jabón que va a entrar en la caja: un pack
  // de cinco son cinco etiquetas. Se expanden los packs y el resto (lote,
  // fechas, numeración) lo resuelve el helper, que es el mismo que usa la
  // tienda.
  const lineasFisicas: { producto: ProductoParaEtiqueta; cantidad: number }[] = [];
  for (const it of data.items) {
    if (it.kind === "product") {
      lineasFisicas.push({ producto: productMap.get(it.refId)!, cantidad: it.quantity });
    } else {
      const pk = packMap.get(it.refId)!;
      for (const ci of pk.items) {
        lineasFisicas.push({
          producto: ci.product,
          cantidad: ci.quantity * it.quantity,
        });
      }
    }
  }
  const productionUnits = buildProductionUnits(lineasFisicas);

  // Crear cliente (sin merge fuerte por ahora; siempre nuevo registro)
  const customer = await prisma.customer.create({
    data: {
      name: data.customer.name,
      cedula: data.customer.cedula || null,
      phone: data.customer.phone || null,
      contactPhone: data.customer.contactPhone || null,
      email: data.customer.email || null,
    },
  });

  const address = await prisma.shippingAddress.create({
    data: {
      customerId: customer.id,
      zoneId: data.address.zoneId,
      province: data.address.province,
      city: data.address.city,
      address: data.address.address,
      reference: data.address.reference || null,
      lat: data.address.lat ?? null,
      lng: data.address.lng ?? null,
      isDefault: true,
    },
  });

  // El número lo resuelve el helper, adentro de una transacción y con
  // reintento: la tienda ahora también crea pedidos y las dos pueden caer
  // en el mismo instante.
  const order = await createOrderWithNumber({
    status: "PENDING",
    customerId: customer.id,
    shippingAddressId: address.id,
    carrierId: data.carrierId,
    zoneId: data.address.zoneId,
    shippingCost: data.shippingCost,
    subtotal,
    total,
    notes: data.notes || null,
    source: data.source || null,
    items: { create: orderItemsData },
    productionUnits: { create: productionUnits },
  });

  revalidatePath("/sistema/pedidos");
  revalidatePath("/sistema");
  // No redirect aquí — el wizard usa el orderId para avanzar al paso 5
  // (centro de impresión). Si quieres redirigir desde otro lugar, hazlo
  // a /pedidos/{id} con el id que devolvemos.
  return { ok: true as const, orderId: order.id };
}

export async function deleteOrdersAction(orderIds: string[]) {
  await requireUser();

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return { ok: false as const, error: "Sin pedidos a eliminar" };
  }
  // Cascade delete: PrintJob + OrderItem + ProductionUnit + Address (manuales)
  await prisma.$transaction(async (tx) => {
    await tx.printJob.deleteMany({ where: { orderId: { in: orderIds } } });
    // ProductionUnit y OrderItem caen en cascada por la relación onDelete
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
  });
  revalidatePath("/sistema/pedidos");
  revalidatePath("/sistema");
  return { ok: true as const, count: orderIds.length };
}

export async function updateOrderStatusAction(
  orderId: string,
  status: EstadoPedido
) {
  await requireUser();
  // El trabajo está en `cambiar-estado.ts`, compartido con la app.
  await cambiarEstadoDePedido(orderId, status);
}

export async function markAsShippedAction(
  orderId: string,
  trackingNumber: string
) {
  await requireUser();

  const trimmed = trackingNumber.trim();
  if (!trimmed) return { ok: false as const, error: "La guía no puede estar vacía" };
  if (trimmed.length > 60) {
    return { ok: false as const, error: "La guía es demasiado larga" };
  }
  const r = await cambiarEstadoDePedido(orderId, "SHIPPED", { guia: trimmed });
  if (!r.ok) return { ok: false as const, error: r.error };
  return { ok: true as const };
}

export async function updateTrackingAction(
  orderId: string,
  trackingNumber: string
) {
  await requireUser();

  const trimmed = trackingNumber.trim();
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: trimmed || null },
  });
  revalidatePath(`/sistema/pedidos/${orderId}`);
  return { ok: true as const };
}
