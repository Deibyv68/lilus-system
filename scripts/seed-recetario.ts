import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { RECIPES } from "../prisma/recetario-data";

/**
 * Carga inicial del recetario.
 *
 * Es idempotente: se puede volver a correr y deja las recetas como están
 * en recetario-data.ts. Los ingredientes, pasos y beneficios se borran y
 * recrean en cada pasada, porque no tienen identidad propia.
 *
 * Los enlaces entre recetas se resuelven en una segunda vuelta, cuando ya
 * existen todas.
 *
 *   npx tsx scripts/seed-recetario.ts
 */
const prisma = new PrismaClient();

async function main() {
  console.log("═══ Recetario LILUS ═══\n");

  // Mapa SKU -> id de producto, para enlazar recetas con el catálogo
  const products = await prisma.product.findMany({
    select: { id: true, sku: true },
  });
  const productIdBySku = new Map(products.map((p) => [p.sku, p.id]));

  // ── Primera vuelta: crear o actualizar las recetas ──
  const idBySlug = new Map<string, string>();

  for (const [index, r] of RECIPES.entries()) {
    const productId = r.productSku
      ? (productIdBySku.get(r.productSku) ?? null)
      : null;

    if (r.productSku && !productId) {
      console.log(`   ⚠ ${r.slug}: no existe el producto ${r.productSku}`);
    }

    const data = {
      name: r.name,
      category: r.category,
      summary: r.summary ?? null,
      yield: r.yield ?? null,
      restTime: r.restTime ?? null,
      container: r.container ?? null,
      usage: r.usage ?? null,
      notes: r.notes?.length ? r.notes.join("\n") : null,
      productId,
      sortOrder: index,
      isActive: true,
    };

    const recipe = await prisma.recipe.upsert({
      where: { slug: r.slug },
      update: data,
      create: { slug: r.slug, ...data },
    });
    idBySlug.set(r.slug, recipe.id);

    // Limpiar el contenido anterior antes de recrearlo
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeBenefit.deleteMany({ where: { recipeId: recipe.id } });

    await prisma.recipeStep.createMany({
      data: r.steps.map((s, i) => ({
        recipeId: recipe.id,
        text: s.text,
        variant: s.variant ?? null,
        sortOrder: i,
      })),
    });

    if (r.benefits?.length) {
      await prisma.recipeBenefit.createMany({
        data: r.benefits.map((b, i) => ({
          recipeId: recipe.id,
          ingredient: b.ingredient ?? null,
          text: b.text,
          sortOrder: i,
        })),
      });
    }
  }

  console.log(`✓ ${RECIPES.length} recetas`);

  // ── Segunda vuelta: ingredientes, ya con todos los ids disponibles ──
  let links = 0;
  for (const r of RECIPES) {
    const recipeId = idBySlug.get(r.slug)!;

    await prisma.recipeIngredient.createMany({
      data: r.ingredients.map((ing, i) => {
        const linkedRecipeId = ing.linkedSlug
          ? (idBySlug.get(ing.linkedSlug) ?? null)
          : null;
        if (ing.linkedSlug && !linkedRecipeId) {
          console.log(`   ⚠ ${r.slug}: no existe la receta ${ing.linkedSlug}`);
        }
        if (linkedRecipeId) links++;
        return {
          recipeId,
          name: ing.name,
          quantity: ing.quantity ?? null,
          note: ing.note ?? null,
          optional: ing.optional ?? false,
          variant: ing.variant ?? null,
          linkedRecipeId,
          sortOrder: i,
        };
      }),
    });
  }

  // ── Resumen ──
  console.log(`✓ ${links} enlaces entre recetas`);

  const porCategoria = await prisma.recipe.groupBy({
    by: ["category"],
    _count: true,
  });
  console.log("\n  Por categoría:");
  for (const c of porCategoria) {
    console.log(`    ${c.category.padEnd(10)} ${c._count}`);
  }

  const conProducto = await prisma.recipe.count({
    where: { productId: { not: null } },
  });
  console.log(`\n  Enlazadas a un producto del catálogo: ${conProducto}`);

  const totalIng = await prisma.recipeIngredient.count();
  const totalPasos = await prisma.recipeStep.count();
  console.log(`  Ingredientes: ${totalIng} · Pasos: ${totalPasos}`);
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
