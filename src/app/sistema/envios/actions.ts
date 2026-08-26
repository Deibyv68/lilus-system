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
