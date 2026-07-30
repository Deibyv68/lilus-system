import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { MATERIALS } from "../prisma/inventario-data";

/**
 * Carga inicial del catálogo de materias primas.
 *
 * Idempotente: se puede volver a correr. NO toca los lotes ni las listas
 * de compra, que son datos que registra la usuaria.
 *
 *   npx tsx scripts/seed-inventario.ts
 */
const prisma = new PrismaClient();

async function main() {
  console.log("═══ Inventario LILUS ═══\n");

  for (const [index, m] of MATERIALS.entries()) {
    const data = {
      name: m.name,
      category: m.category,
      inciName: m.inciName ?? null,
      tradeName: m.tradeName ?? null,
      manufacturer: m.manufacturer ?? null,
      purpose: m.purpose ?? null,
      usageMin: m.usageMin ?? null,
      usageMax: m.usageMax ?? null,
      phMin: m.phMin ?? null,
      phMax: m.phMax ?? null,
      maxTemp: m.maxTemp ?? null,
      solubility: m.solubility ?? null,
      leaveOn: m.leaveOn ?? null,
      spectrum: m.spectrum ?? null,
      incompatible: m.incompatible ?? null,
      container: m.container ?? null,
      storage: m.storage ?? null,
      lightSensitive: m.lightSensitive ?? false,
      oxygenSensitive: m.oxygenSensitive ?? false,
      moistureSensitive: m.moistureSensitive ?? false,
      openedShelfLife: m.openedShelfLife ?? null,
      notes: m.notes ?? null,
      sortOrder: index,
      isActive: true,
    };

    await prisma.material.upsert({
      where: { slug: m.slug },
      update: data,
      create: { slug: m.slug, ...data },
    });
  }

  console.log(`✓ ${MATERIALS.length} materias primas\n`);

  // ── Resumen ──
  const porCategoria = await prisma.material.groupBy({
    by: ["category"],
    _count: true,
    orderBy: { category: "asc" },
  });
  console.log("  Por categoría:");
  for (const c of porCategoria) {
    console.log(`    ${c.category.padEnd(14)} ${c._count}`);
  }

  const conFicha = await prisma.material.count({
    where: { OR: [{ usageMax: { not: null } }, { phMax: { not: null } }] },
  });
  const porComprar = await prisma.material.count({
    where: { notes: { contains: "PENDIENTE COMPRAR" } },
  });
  const delicados = await prisma.material.count({
    where: { OR: [{ lightSensitive: true }, { oxygenSensitive: true }] },
  });

  console.log("");
  console.log(`  Con datos técnicos cargados:  ${conFicha} de ${MATERIALS.length}`);
  console.log(`  Pendientes de comprar:        ${porComprar}`);
  console.log(`  Sensibles a luz u oxígeno:    ${delicados}`);

  console.log("");
  console.log("  Los campos técnicos vacíos son la lista de fichas");
  console.log("  técnicas que hay que pedirle al proveedor.");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
