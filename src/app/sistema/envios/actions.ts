"use server";

import { revalidatePath } from "next/cache";
import { revalidarTienda } from "@/lib/revalidar-tienda";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function upsertRateAction(formData: FormData) {
  await requireUser();

  const zoneId = String(formData.get("zoneId") ?? "");
  const carrierId = String(formData.get("carrierId") ?? "");
  const price = Number(formData.get("price") ?? 0);
  if (!zoneId || !carrierId || isNaN(price) || price < 0) {
    return { ok: false, error: "Datos inválidos" };
  }
  await prisma.shippingRate.upsert({
    where: { zoneId_carrierId: { zoneId, carrierId } },
    update: { price },
    create: { zoneId, carrierId, price },
  });
  revalidatePath("/sistema/envios");
  revalidarTienda();
  return { ok: true };
}

export async function createZoneAction(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nombre requerido" };
  try {
    await prisma.shippingZone.create({ data: { name } });
    revalidatePath("/sistema/envios");
    revalidarTienda();
    return { ok: true };
  } catch {
    return { ok: false, error: "Esa zona ya existe" };
  }
}

export async function createCarrierAction(formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nombre requerido" };
  try {
    await prisma.carrier.create({ data: { name } });
    revalidatePath("/sistema/envios");
    revalidarTienda();
    return { ok: true };
  } catch {
    return { ok: false, error: "Esa transportadora ya existe" };
  }
}

export async function deleteZoneAction(id: string) {
  await requireUser();

  await prisma.shippingZone.delete({ where: { id } });
  revalidatePath("/sistema/envios");
  revalidarTienda();
}

export async function deleteCarrierAction(id: string) {
  await requireUser();

  await prisma.carrier.delete({ where: { id } });
  revalidatePath("/sistema/envios");
  revalidarTienda();
}

/**
 * Qué cantones cubre una zona.
 *
 * De esto depende que el envío se cobre bien: la tienda deduce la zona
 * del cantón que elige quien compra, en vez de preguntárselo. Antes eran
 * dos preguntas separadas y se podía marcar «Fuera de Quito» con una
 * dirección en Quito.
 *
 * Dejar una zona sin cantones significa «todo lo demás» — hace falta que
 * haya exactamente una así, o los pedidos de fuera de las listas no
 * tendrían dónde caer.
 */
export async function guardarCantonesAction(zoneId: string, cantones: string) {
  await requireUser();

  const limpio = cantones
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .join(", ");

  await prisma.shippingZone.update({
    where: { id: zoneId },
    data: { cantones: limpio || null },
  });

  revalidatePath("/sistema/envios");
  revalidarTienda();
  return { ok: true as const };
}
