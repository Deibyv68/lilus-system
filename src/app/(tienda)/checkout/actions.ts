"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { preciosVigentes } from "@/lib/tienda";
import {
  createOrderWithNumber,
  buildProductionUnits,
  type ProductoParaEtiqueta,
} from "@/lib/order-utils";

/**
 * Crear el pedido que llega por la web.
 *
 * Esta acción es pública: cualquiera puede llamarla, y no hay sesión que
 * mirar. Todo lo que llega de afuera se trata como una propuesta, no como
 * un dato. En concreto:
 *
 * - Los precios NO se leen del carrito. Del carrito solo se acepta qué
 *   artículo y cuántos; cuánto cuesta se relee de la base.
 * - El costo de envío tampoco: sale de la tarifa de la zona elegida.
 * - Un artículo despublicado se rechaza aunque venga en el carrito. Puede
 *   ser un carrito viejo, guardado antes de que se diera de baja.
 *
 * El pedido nace en PENDING. El pago es por transferencia y lo confirma la
 * dueña a mano cuando ve el comprobante: nada acá puede saber si el dinero
 * llegó.
 */

const MAX_LINEAS = 40;

const esquema = z.object({
  cliente: z.object({
    nombre: z.string().trim().min(2, "Necesitamos tu nombre").max(120),
    // El teléfono va impreso en la etiqueta de envío: sin él la
    // transportadora no tiene a quién llamar si no encuentra la dirección.
    telefono: z.string().trim().min(7, "Necesitamos un teléfono de contacto").max(30),
    email: z.string().trim().email("Ese correo no parece válido").max(160),
    // Solo si quiere factura. Ver la nota en el formulario.
    cedula: z.string().trim().max(20).optional().or(z.literal("")),
  }),
  direccion: z.object({
    zonaId: z.string().min(1, "Elige a dónde enviamos"),
    provincia: z.string().trim().min(2, "Falta la provincia").max(80),
    ciudad: z.string().trim().min(2, "Falta la ciudad").max(80),
    calle: z.string().trim().min(6, "La dirección es muy corta").max(300),
    referencia: z.string().trim().max(300).optional().or(z.literal("")),
  }),
  nota: z.string().trim().max(500).optional().or(z.literal("")),
  lineas: z
    .array(
      z.object({
        tipo: z.enum(["producto", "pack"]),
        id: z.string().min(1),
        cantidad: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Tu carrito está vacío")
    .max(MAX_LINEAS),
});

export type DatosCheckout = z.infer<typeof esquema>;

type Resultado =
  | { ok: true; token: string; numero: string }
  | { ok: false; error: string };

export async function crearPedidoWebAction(datos: unknown): Promise<Resultado> {
  const validado = esquema.safeParse(datos);
  if (!validado.success) {
    return { ok: false, error: validado.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const d = validado.data;

  // ── Precios, releídos de la base ──
  const precios = await preciosVigentes(d.lineas.map((l) => ({ tipo: l.tipo, id: l.id })));

  const items: {
    productId?: string;
    packId?: string;
    itemName: string;
    itemSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[] = [];

  let subtotal = 0;
  for (const l of d.lineas) {
    const vigente = precios.get(`${l.tipo}:${l.id}`);
    if (!vigente) {
      // Se dio de baja mientras el carrito esperaba, o nunca existió.
      return {
        ok: false,
        error:
          "Uno de los productos de tu carrito ya no está disponible. Quítalo y vuelve a intentar.",
      };
    }
    const lineTotal = vigente.precio * l.cantidad;
    subtotal += lineTotal;
    items.push({
      ...(l.tipo === "producto" ? { productId: l.id } : { packId: l.id }),
      itemName: vigente.nombre,
      itemSku: vigente.sku,
      quantity: l.cantidad,
      unitPrice: vigente.precio,
      lineTotal,
    });
  }

  // ── Envío, sacado de la tarifa real ──
  const zona = await prisma.shippingZone.findUnique({
    where: { id: d.direccion.zonaId },
    include: {
      rates: {
        where: { carrier: { isActive: true } },
        include: { carrier: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
  });
  const tarifa = zona?.rates[0];
  if (!zona || !tarifa) {
    return { ok: false, error: "No tenemos envío configurado para esa zona." };
  }
  const shippingCost = tarifa.price;

  // ── Unidades físicas, para que la etiqueta 2×1 salga igual que siempre ──
  const idsProducto = d.lineas.filter((l) => l.tipo === "producto").map((l) => l.id);
  const idsPack = d.lineas.filter((l) => l.tipo === "pack").map((l) => l.id);

  const CAMPOS_ETIQUETA = {
    id: true,
    sku: true,
    name: true,
    shortName: true,
    ingredients: true,
    shelfLifeMonths: true,
  } as const;

  const [productos, packs] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: idsProducto } }, select: CAMPOS_ETIQUETA }),
    prisma.pack.findMany({
      where: { id: { in: idsPack } },
      select: { id: true, items: { select: { quantity: true, product: { select: CAMPOS_ETIQUETA } } } },
    }),
  ]);

  const porId = new Map<string, ProductoParaEtiqueta>(productos.map((p) => [p.id, p]));
  const packPorId = new Map(packs.map((p) => [p.id, p]));

  const lineasFisicas: { producto: ProductoParaEtiqueta; cantidad: number }[] = [];
  for (const l of d.lineas) {
    if (l.tipo === "producto") {
      const p = porId.get(l.id);
      if (p) lineasFisicas.push({ producto: p, cantidad: l.cantidad });
    } else {
      for (const ci of packPorId.get(l.id)?.items ?? []) {
        lineasFisicas.push({ producto: ci.product, cantidad: ci.quantity * l.cantidad });
      }
    }
  }
  const productionUnits = buildProductionUnits(lineasFisicas);

  // ── Cliente: se reusa el que ya existe ──
  const customerId = await encontrarOCrearCliente(d.cliente);

  const address = await prisma.shippingAddress.create({
    data: {
      customerId,
      zoneId: zona.id,
      province: d.direccion.provincia,
      city: d.direccion.ciudad,
      address: d.direccion.calle,
      reference: d.direccion.referencia || null,
      isDefault: true,
    },
  });

  const pedido = await createOrderWithNumber({
    status: "PENDING",
    customerId,
    shippingAddressId: address.id,
    carrierId: tarifa.carrierId,
    zoneId: zona.id,
    shippingCost,
    subtotal,
    total: subtotal + shippingCost,
    notes: d.nota || null,
    source: "Web",
    publicToken: randomBytes(24).toString("base64url"),
    items: { create: items },
    productionUnits: { create: productionUnits },
  });

  return { ok: true, token: pedido.publicToken!, numero: pedido.orderNumber };
}

/**
 * Busca al cliente antes de crearlo.
 *
 * El panel siempre creaba uno nuevo, así que una clienta que compraba tres
 * veces quedaba como tres personas distintas. Con la tienda esto se vuelve
 * peor: la gente vuelve, y vuelve escribiendo su correo igual.
 *
 * Se busca por correo primero, que es lo que la gente escribe igual dos
 * veces; el teléfono lo tipean con y sin cero, con y sin espacios, así que
 * se compara solo por sus dígitos.
 *
 * Cuando se lo encuentra, se completan los huecos pero no se pisa lo que ya
 * hay: si escribió mal el nombre esta vez, no tiene por qué perderse el
 * nombre bueno de la vez anterior.
 */
async function encontrarOCrearCliente(c: {
  nombre: string;
  telefono: string;
  email: string;
  cedula?: string;
}): Promise<string> {
  const email = c.email.toLowerCase();
  const digitos = c.telefono.replace(/\D/g, "");

  let encontrado = await prisma.customer.findFirst({
    where: { email: { equals: email } },
    select: { id: true, name: true, phone: true, contactPhone: true, cedula: true },
  });

  if (!encontrado && digitos.length >= 7) {
    // SQLite no normaliza el formato, así que se traen los candidatos por
    // los últimos dígitos y se comparan ya limpios. Son pocos clientes:
    // no hace falta nada más sofisticado.
    const candidatos = await prisma.customer.findMany({
      where: { phone: { contains: digitos.slice(-7) } },
      select: { id: true, name: true, phone: true, contactPhone: true, cedula: true },
      take: 20,
    });
    encontrado =
      candidatos.find((x) => (x.phone ?? "").replace(/\D/g, "") === digitos) ?? null;
  }

  if (encontrado) {
    await prisma.customer.update({
      where: { id: encontrado.id },
      data: {
        phone: encontrado.phone ?? c.telefono,
        contactPhone: encontrado.contactPhone ?? c.telefono,
        cedula: encontrado.cedula ?? (c.cedula || null),
      },
    });
    return encontrado.id;
  }

  const creado = await prisma.customer.create({
    data: {
      name: c.nombre,
      email,
      phone: c.telefono,
      contactPhone: c.telefono,
      cedula: c.cedula || null,
    },
    select: { id: true },
  });
  return creado.id;
}
