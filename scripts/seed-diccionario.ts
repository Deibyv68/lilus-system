import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { GLOSSARY } from "../prisma/diccionario-data";

/**
 * Carga del diccionario.
 *
 *   npx tsx scripts/seed-diccionario.ts
 */
const prisma = new PrismaClient();

async function main() {
  console.log("═══ Diccionario LILUS ═══\n");

  for (const [index, t] of GLOSSARY.entries()) {
    const data = {
      term: t.term,
      aliases: t.aliases?.length ? t.aliases.join(",") : null,
      shortDef: t.shortDef,
      longDef: t.longDef ?? null,
      example: t.example ?? null,
      category: t.category,
      sortOrder: index,
      isActive: true,
    };
    await prisma.glossaryTerm.upsert({
      where: { slug: t.slug },
      update: data,
      create: { slug: t.slug, ...data },
    });
  }

  console.log(`✓ ${GLOSSARY.length} términos\n`);

  const porCategoria = await prisma.glossaryTerm.groupBy({
    by: ["category"],
    _count: true,
    orderBy: { category: "asc" },
  });
  console.log("  Por categoría:");
  for (const c of porCategoria) {
    console.log(`    ${c.category.padEnd(12)} ${c._count}`);
  }

  const conEjemplo = await prisma.glossaryTerm.count({
    where: { example: { not: null } },
  });
  const conLarga = await prisma.glossaryTerm.count({
    where: { longDef: { not: null } },
  });
  const totalAlias = GLOSSARY.reduce((s, t) => s + (t.aliases?.length ?? 0), 0);

  console.log("");
  console.log(`  Con explicación larga: ${conLarga}`);
  console.log(`  Con ejemplo del recetario: ${conEjemplo}`);
  console.log(`  Formas alternativas para detectar: ${totalAlias}`);
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
