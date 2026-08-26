import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ShoppingCart, PlusCircle } from "lucide-react";
import { MaterialBrowser, type MaterialCard } from "./material-browser";

export const dynamic = "force-dynamic";

// Un lote que caduca dentro de este plazo se marca en la ficha
const DIAS_AVISO_CADUCIDAD = 60;

export default async function InventarioPage() {
  const [materials, listasAbiertas] = await Promise.all([
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { lots: true },
    }),
    prisma.shoppingList.count({ where: { doneAt: null } }),
  ]);

  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_AVISO_CADUCIDAD);

  const cards: MaterialCard[] = materials.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    category: m.category,
    inciName: m.inciName,
    purpose: m.purpose,
    storage: m.storage,
    // Consideramos que tiene ficha si al menos sabemos dosis o pH
    hasTechData: m.usageMax != null || m.phMax != null,
    pendingPurchase: (m.notes ?? "").includes("PENDIENTE COMPRAR"),
    openLots: m.lots.filter((l) => l.status === "abierto").length,
    expiringSoon: m.lots.some(
      (l) =>
        l.status !== "agotado" &&
        l.status !== "descartado" &&
        l.expiresAt != null &&
        l.expiresAt <= limite
    ),
  }));

  return (
    <>
      <PageHeader
        title="Inventario"
        description={`${materials.length} materias primas`}
        actions={
          <Button asChild size="lg" className="h-11">
            <Link href="/sistema/inventario/nueva">
              <PlusCircle className="size-4" /> Nueva
            </Link>
          </Button>
        }
      />

      <Link
        href="/sistema/inventario/compras"
        className="flex items-center gap-3 p-3 mb-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors"
      >
        <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <ShoppingCart className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">Listas de compra</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {listasAbiertas > 0
              ? `${listasAbiertas} ${listasAbiertas === 1 ? "lista pendiente" : "listas pendientes"}`
              : "Armar una lista para ir a comprar"}
          </p>
        </div>
        {listasAbiertas > 0 && (
          <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
            {listasAbiertas}
          </span>
        )}
      </Link>

      {materials.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay materias primas cargadas.
          </p>
        </div>
      ) : (
        <MaterialBrowser materials={cards} />
      )}
    </>
  );
}
