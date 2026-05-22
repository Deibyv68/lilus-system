"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { packSchema } from "@/lib/schemas";
import { saveUpload } from "@/lib/uploads";

function parseItems(formData: FormData): { productId: string; quantity: number }[] {
  const raw = formData.get("items");
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as { productId: string; quantity: number }[];
    return parsed.filter((i) => i.productId && i.quantity > 0);
  } catch {
    return [];
  }
}

export async function createPackAction(formData: FormData) {
  const items = parseItems(formData);
  const parsed = packSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    productionCost: formData.get("productionCost") ?? 0,
    isActive: formData.get("isActive") === "on",
    items,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUpload(imageFile, "packs", "image");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  try {
    const pack = await prisma.pack.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        price: data.price,
        productionCost: data.productionCost,
        isActive: data.isActive,
        imageUrl,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
    });
    revalidatePath("/packs");
    redirect(`/packs/${pack.id}`);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false, error: "Ya existe un pack con ese SKU" };
    }
    throw e;
  }
}

export async function updatePackAction(id: string, formData: FormData) {
  const items = parseItems(formData);
  const parsed = packSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    productionCost: formData.get("productionCost") ?? 0,
    isActive: formData.get("isActive") === "on",
    items,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUpload(imageFile, "packs", "image");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  try {
    await prisma.$transaction([
      prisma.packItem.deleteMany({ where: { packId: id } }),
      prisma.pack.update({
        where: { id },
        data: {
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          price: data.price,
          productionCost: data.productionCost,
          isActive: data.isActive,
          ...(imageUrl ? { imageUrl } : {}),
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
      }),
    ]);
    revalidatePath("/packs");
    revalidatePath(`/packs/${id}`);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false, error: "Ya existe un pack con ese SKU" };
    }
    throw e;
  }
}

export async function deletePackAction(id: string) {
  await prisma.pack.delete({ where: { id } });
  revalidatePath("/packs");
  redirect("/packs");
}
