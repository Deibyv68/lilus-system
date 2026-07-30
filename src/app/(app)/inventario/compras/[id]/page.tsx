import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { ShoppingListView } from "./shopping-list-view";

export const dynamic = "force-dynamic";

export default async function ListaCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [list, materials] = await Promise.all([
    prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            material: {
              select: { id: true, name: true, category: true, slug: true },
            },
          },
        },
      },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, category: true, notes: true },
    }),
  ]);

  if (!list) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href="/inventario/compras"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Listas de compra
        </Link>
      </div>

      <ShoppingListView
        list={{
          id: list.id,
          name: list.name,
          notes: list.notes,
          doneAt: list.doneAt?.toISOString() ?? null,
        }}
        items={list.items.map((i) => ({
          id: i.id,
          materialId: i.materialId,
          materialName: i.material?.name ?? null,
          materialSlug: i.material?.slug ?? null,
          category: i.material?.category ?? null,
          freeText: i.freeText,
          quantity: i.quantity,
          note: i.note,
          checked: i.checked,
        }))}
        materials={materials.map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          pending: (m.notes ?? "").includes("PENDIENTE COMPRAR"),
        }))}
      />
    </>
  );
}
