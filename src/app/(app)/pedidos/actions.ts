"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/schemas";
import {
  generateOrderNumber,
  generateBatchCode,
  calcExpiry,
} from "@/lib/order-utils";

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
  };
  carrierId: string;
  shippingCost: number;
  notes?: string;
  source?: string;
  items: { kind: "product" | "pack"; refId: string; quantity: number }[];
};

export async function createOrderAction(payload: CreateOrderPayload) {
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

  // Construir ProductionUnits (una por cada unidad física)
  const now = new Date();
  let seq = 0;
  const productionUnits: Array<{
    productId: string;
    productName: string;
    productSku: string;
    batchCode: string;
    manufactureDate: Date;
    expiryDate: Date;
    ingredients: string | null;
  }> = [];

  for (const it of data.items) {
    if (it.kind === "product") {
      const p = productMap.get(it.refId)!;
      for (let q = 0; q < it.quantity; q++) {
        seq++;
        productionUnits.push({
          productId: p.id,
          productName: p.shortName ?? p.name,
          productSku: p.sku,
          batchCode: generateBatchCode(now, seq),
          manufactureDate: now,
          expiryDate: calcExpiry(now, p.shelfLifeMonths ?? 12),
          ingredients: p.ingredients,
        });
      }
    } else {
      const pk = packMap.get(it.refId)!;
      for (let pq = 0; pq < it.quantity; pq++) {
        for (const ci of pk.items) {
          for (let q = 0; q < ci.quantity; q++) {
            seq++;
            productionUnits.push({
              productId: ci.product.id,
              productName: ci.product.shortName ?? ci.product.name,
              productSku: ci.product.sku,
              batchCode: generateBatchCode(now, seq),
              manufactureDate: now,
              expiryDate: calcExpiry(now, ci.product.shelfLifeMonths ?? 12),
              ingredients: ci.product.ingredients,
            });
          }
        }
      }
    }
  }

  const orderNumber = await generateOrderNumber();

  // Crear cliente (sin merge fuerte por ahora; siempre nuevo registro)
  const customer = await prisma.customer.create({
    data: {
      name: data.customer.name,
      cedula: data.customer.cedula || null,
      phone: data.customer.phone || null,
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
      isDefault: true,
    },
  });

  const order = await prisma.order.create({
    data: {
      orderNumber,
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
    },
  });

  revalidatePath("/pedidos");
  revalidatePath("/");
  redirect(`/pedidos/${order.id}`);
}

export async function updateOrderStatusAction(
  orderId: string,
  status: "PENDING" | "PAID" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED"
) {
  const data: { status: typeof status; shippedAt?: Date | null } = { status };
  if (status === "SHIPPED") {
    data.shippedAt = new Date();
  }
  await prisma.order.update({ where: { id: orderId }, data });
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
}

export async function markAsShippedAction(
  orderId: string,
  trackingNumber: string
) {
  const trimmed = trackingNumber.trim();
  if (!trimmed) return { ok: false as const, error: "La guía no puede estar vacía" };
  if (trimmed.length > 60) {
    return { ok: false as const, error: "La guía es demasiado larga" };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "SHIPPED",
      trackingNumber: trimmed,
      shippedAt: new Date(),
    },
  });
  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  return { ok: true as const };
}

export async function updateTrackingAction(
  orderId: string,
  trackingNumber: string
) {
  const trimmed = trackingNumber.trim();
  await prisma.order.update({
    where: { id: orderId },
    data: { trackingNumber: trimmed || null },
  });
  revalidatePath(`/pedidos/${orderId}`);
  return { ok: true as const };
}
