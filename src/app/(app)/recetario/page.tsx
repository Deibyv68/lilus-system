import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
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
