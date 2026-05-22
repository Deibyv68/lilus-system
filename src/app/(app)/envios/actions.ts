"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function upsertRateAction(formData: FormData) {
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
  revalidatePath("/envios");
  return { ok: true };
}

export async function createZoneAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nombre requerido" };
  try {
    await prisma.shippingZone.create({ data: { name } });
    revalidatePath("/envios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Esa zona ya existe" };
  }
}

export async function createCarrierAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Nombre requerido" };
  try {
    await prisma.carrier.create({ data: { name } });
    revalidatePath("/envios");
    return { ok: true };
  } catch {
    return { ok: false, error: "Esa transportadora ya existe" };
  }
}

export async function deleteZoneAction(id: string) {
  await prisma.shippingZone.delete({ where: { id } });
  revalidatePath("/envios");
}

export async function deleteCarrierAction(id: string) {
  await prisma.carrier.delete({ where: { id } });
  revalidatePath("/envios");
}
