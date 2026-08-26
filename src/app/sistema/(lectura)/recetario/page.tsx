import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ChevronRight, ClipboardCheck, BookMarked } from "lucide-react";
import { RecipeBrowser, type RecipeCard } from "./recipe-browser";

export const dynamic = "force-dynamic";

export default async function RecetarioPage() {
  const recipes = await prisma.recipe.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      product: { select: { name: true } },
      _count: { select: { ingredients: true, steps: true, usedIn: true } },
    },
  });

  const cards: RecipeCard[] = recipes.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    summary: r.summary,
    imageUrl: r.imageUrl,
    ingredientCount: r._count.ingredients,
    stepCount: r._count.steps,
    usedInCount: r._count.usedIn,
    productName: r.product?.name ?? null,
  }));

  return (
    <>
      <PageHeader
        title="Recetario"
        description={`${recipes.length} recetas de elaboración`}
      />

      <div className="grid gap-2 sm:grid-cols-2 mb-4">
        <Link
          href="/sistema/recetario/buenas-practicas"
          className="flex items-center gap-3 p-3 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 transition-colors"
        >
          <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <ClipboardCheck className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight">Buenas prácticas</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Temperaturas, sanitización y bitácora de lote
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground shrink-0" />
        </Link>

        <Link
          href="/sistema/diccionario"
          className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition-colors"
        >
          <div className="size-10 rounded-lg bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <BookMarked className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold leading-tight">Diccionario</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Qué significa cada palabra del recetario
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground shrink-0" />
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Todavía no hay recetas cargadas.
          </p>
        </div>
      ) : (
        <RecipeBrowser recipes={cards} />
      )}
    </>
  );
}
