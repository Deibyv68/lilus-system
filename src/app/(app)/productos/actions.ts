"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/schemas";
import { saveUpload } from "@/lib/uploads";

function pickString(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

export async function createProductAction(formData: FormData) {
  const parsed = productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    shortName: formData.get("shortName") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    productionCost: formData.get("productionCost") ?? 0,
    weightGrams: formData.get("weightGrams") || undefined,
    ingredients: formData.get("ingredients") ?? "",
    shelfLifeMonths: formData.get("shelfLifeMonths") ?? 12,
    stock: formData.get("stock") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUpload(imageFile, "products", "image");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  let labelPdfUrl: string | undefined;
  const labelFile = formData.get("labelPdf");
  if (labelFile instanceof File && labelFile.size > 0) {
    try {
      labelPdfUrl = await saveUpload(labelFile, "product-labels", "pdf");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  try {
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        shortName: pickString(formData.get("shortName")),
        description: pickString(formData.get("description")),
        price: data.price,
        productionCost: data.productionCost,
        weightGrams: data.weightGrams,
        ingredients: pickString(formData.get("ingredients")),
        shelfLifeMonths: data.shelfLifeMonths,
        stock: data.stock,
        isActive: data.isActive,
        imageUrl,
        labelPdfUrl,
      },
    });
    revalidatePath("/productos");
    redirect(`/productos/${product.id}`);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false, error: "Ya existe un producto con ese SKU" };
    }
    throw e;
  }
}

export async function updateProductAction(id: string, formData: FormData) {
  const parsed = productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    shortName: formData.get("shortName") ?? "",
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    productionCost: formData.get("productionCost") ?? 0,
    weightGrams: formData.get("weightGrams") || undefined,
    ingredients: formData.get("ingredients") ?? "",
    shelfLifeMonths: formData.get("shelfLifeMonths") ?? 12,
    stock: formData.get("stock") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const data = parsed.data;

  let imageUrl: string | undefined;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    try {
      imageUrl = await saveUpload(imageFile, "products", "image");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  let labelPdfUrl: string | undefined;
  const labelFile = formData.get("labelPdf");
  if (labelFile instanceof File && labelFile.size > 0) {
    try {
      labelPdfUrl = await saveUpload(labelFile, "product-labels", "pdf");
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        shortName: pickString(formData.get("shortName")),
        description: pickString(formData.get("description")),
        price: data.price,
        productionCost: data.productionCost,
        weightGrams: data.weightGrams,
        ingredients: pickString(formData.get("ingredients")),
        shelfLifeMonths: data.shelfLifeMonths,
        stock: data.stock,
        isActive: data.isActive,
        ...(imageUrl ? { imageUrl } : {}),
        ...(labelPdfUrl ? { labelPdfUrl } : {}),
      },
    });
    revalidatePath("/productos");
    revalidatePath(`/productos/${id}`);
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return { ok: false, error: "Ya existe un producto con ese SKU" };
    }
    throw e;
  }
}

export async function deleteProductAction(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/productos");
  redirect("/productos");
}
