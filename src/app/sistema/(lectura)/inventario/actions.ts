"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

/**
 * Lee un campo de texto. Los selects usan "none" para el vacío porque
 * Radix no admite un SelectItem con value="", así que aquí se traduce.
 */
function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" || t === "none" ? null : t;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on";
}

function date(fd: FormData, key: string): Date | null {
  const v = str(fd, key);
  if (!v) return null;
  // El input date da "YYYY-MM-DD". Lo anclamos a mediodía para que el
  // cambio de zona horaria no lo mueva al día anterior.
  const d = new Date(`${v}T12:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Convierte un nombre en un slug utilizable en la URL.
 *
 * NFD separa cada letra acentuada en letra + tilde, y como después solo
 * dejamos pasar a-z y 0-9, las tildes se caen solas. Así "Ácido láctico"
 * queda "acido-lactico" sin necesidad de una tabla de reemplazos.
 */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ─────────────────────── Materias primas ───────────────────────

function materialData(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    category: str(fd, "category") ?? "auxiliar",
    inciName: str(fd, "inciName"),
    tradeName: str(fd, "tradeName"),
    manufacturer: str(fd, "manufacturer"),
    purpose: str(fd, "purpose"),
    usageMin: num(fd, "usageMin"),
    usageMax: num(fd, "usageMax"),
    phMin: num(fd, "phMin"),
    phMax: num(fd, "phMax"),
    maxTemp: num(fd, "maxTemp"),
    solubility: str(fd, "solubility"),
    leaveOn: str(fd, "leaveOn") === "si" ? true : str(fd, "leaveOn") === "no" ? false : null,
    spectrum: str(fd, "spectrum"),
    incompatible: str(fd, "incompatible"),
    datasheetUrl: str(fd, "datasheetUrl"),
    container: str(fd, "container"),
    storage: str(fd, "storage"),
    lightSensitive: bool(fd, "lightSensitive"),
    oxygenSensitive: bool(fd, "oxygenSensitive"),
    moistureSensitive: bool(fd, "moistureSensitive"),
    openedShelfLife: str(fd, "openedShelfLife"),
    notes: str(fd, "notes"),
  };
}

export async function createMaterialAction(fd: FormData) {
  await requireUser();

  const data = materialData(fd);
  if (!data.name) return { ok: false, error: "El nombre es obligatorio" };

  // Si el slug ya existe, le agregamos un sufijo en vez de fallar
  const base = slugify(data.name);
  let slug = base;
  for (let i = 2; await prisma.material.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }

  const created = await prisma.material.create({ data: { slug, ...data } });
  revalidatePath("/sistema/inventario");
  redirect(`/sistema/inventario/${created.slug}`);
}

export async function updateMaterialAction(id: string, fd: FormData) {
  await requireUser();

  const data = materialData(fd);
  if (!data.name) return { ok: false, error: "El nombre es obligatorio" };

  const updated = await prisma.material.update({ where: { id }, data });
  revalidatePath("/sistema/inventario");
  revalidatePath(`/sistema/inventario/${updated.slug}`);
  return { ok: true };
}

export async function deleteMaterialAction(id: string) {
  await requireUser();

  await prisma.material.delete({ where: { id } });
  revalidatePath("/sistema/inventario");
  redirect("/sistema/inventario");
}

// ─────────────────────── Lotes ───────────────────────

export async function createLotAction(materialId: string, fd: FormData) {
  await requireUser();

  await prisma.materialLot.create({
    data: {
      materialId,
      supplier: str(fd, "supplier"),
      purchasedAt: date(fd, "purchasedAt"),
      openedAt: date(fd, "openedAt"),
      expiresAt: date(fd, "expiresAt"),
      lotCode: str(fd, "lotCode"),
      quantity: num(fd, "quantity"),
      unit: str(fd, "unit"),
      price: num(fd, "price"),
      container: str(fd, "container"),
      status: str(fd, "status") ?? "sin-abrir",
      notes: str(fd, "notes"),
    },
  });
  const m = await prisma.material.findUnique({ where: { id: materialId } });
  if (m) revalidatePath(`/sistema/inventario/${m.slug}`);
  revalidatePath("/sistema/inventario");
  return { ok: true };
}

export async function updateLotStatusAction(lotId: string, status: string) {
  await requireUser();

  const lot = await prisma.materialLot.update({
    where: { id: lotId },
    // Abrir un lote sin fecha de apertura la pone hoy: es el dato que
    // más se olvida y el que más sirve después.
    data: {
      status,
      ...(status === "abierto" ? { openedAt: new Date() } : {}),
    },
    include: { material: true },
  });
  revalidatePath(`/sistema/inventario/${lot.material.slug}`);
  revalidatePath("/sistema/inventario");
  return { ok: true };
}

export async function deleteLotAction(lotId: string) {
  await requireUser();

  const lot = await prisma.materialLot.delete({
    where: { id: lotId },
    include: { material: true },
  });
  revalidatePath(`/sistema/inventario/${lot.material.slug}`);
  revalidatePath("/sistema/inventario");
  return { ok: true };
}

// ─────────────────────── Listas de compra ───────────────────────

export async function createShoppingListAction(fd: FormData) {
  await requireUser();

  const name = str(fd, "name") ?? `Compra ${new Date().toLocaleDateString("es-EC")}`;
  const list = await prisma.shoppingList.create({
    data: { name, notes: str(fd, "notes") },
  });
  revalidatePath("/sistema/inventario/compras");
  redirect(`/sistema/inventario/compras/${list.id}`);
}

export async function addShoppingItemsAction(
  listId: string,
  materialIds: string[]
) {
  await requireUser();

  if (materialIds.length === 0) return { ok: true };

  const last = await prisma.shoppingItem.findFirst({
    where: { listId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let order = (last?.sortOrder ?? -1) + 1;

  // No repetimos materiales que ya están en la lista
  const existing = await prisma.shoppingItem.findMany({
    where: { listId, materialId: { in: materialIds } },
    select: { materialId: true },
  });
  const already = new Set(existing.map((e) => e.materialId));

  await prisma.shoppingItem.createMany({
    data: materialIds
      .filter((id) => !already.has(id))
      .map((materialId) => ({ listId, materialId, sortOrder: order++ })),
  });

  revalidatePath(`/sistema/inventario/compras/${listId}`);
  return { ok: true };
}

export async function addFreeTextItemAction(listId: string, text: string) {
  await requireUser();

  const t = text.trim();
  if (!t) return { ok: false, error: "Escribe algo" };

  const last = await prisma.shoppingItem.findFirst({
    where: { listId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.shoppingItem.create({
    data: { listId, freeText: t, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  revalidatePath(`/sistema/inventario/compras/${listId}`);
  return { ok: true };
}

export async function updateShoppingItemAction(
  itemId: string,
  patch: { quantity?: string; note?: string; checked?: boolean }
) {
  await requireUser();

  const item = await prisma.shoppingItem.update({
    where: { id: itemId },
    data: {
      ...(patch.quantity !== undefined ? { quantity: patch.quantity || null } : {}),
      ...(patch.note !== undefined ? { note: patch.note || null } : {}),
      ...(patch.checked !== undefined ? { checked: patch.checked } : {}),
    },
  });
  revalidatePath(`/sistema/inventario/compras/${item.listId}`);
  return { ok: true };
}

export async function deleteShoppingItemAction(itemId: string) {
  await requireUser();

  const item = await prisma.shoppingItem.delete({ where: { id: itemId } });
  revalidatePath(`/sistema/inventario/compras/${item.listId}`);
  return { ok: true };
}

export async function finishShoppingListAction(listId: string) {
  await requireUser();

  const list = await prisma.shoppingList.update({
    where: { id: listId },
    data: { doneAt: new Date() },
  });
  revalidatePath("/sistema/inventario/compras");
  revalidatePath(`/sistema/inventario/compras/${list.id}`);
  return { ok: true };
}

export async function reopenShoppingListAction(listId: string) {
  await requireUser();

  await prisma.shoppingList.update({
    where: { id: listId },
    data: { doneAt: null },
  });
  revalidatePath("/sistema/inventario/compras");
  revalidatePath(`/sistema/inventario/compras/${listId}`);
  return { ok: true };
}

export async function deleteShoppingListAction(listId: string) {
  await requireUser();

  await prisma.shoppingList.delete({ where: { id: listId } });
  revalidatePath("/sistema/inventario/compras");
  redirect("/sistema/inventario/compras");
}
