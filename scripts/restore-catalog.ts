import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

/**
 * Restaurador del catálogo LILUS.
 *
 * Recrea TODO lo que se puede regenerar desde código:
 *  - Settings (brand, sender, prefix)
 *  - Zonas de envío (Quito, Fuera de Quito)
 *  - Transportadora (Servientrega)
 *  - Tarifas de envío
 *  - Productos (jabones + extras + manzanilla y miel)
 *  - Packs (5 packs predefinidos)
 *  - Asociación de PDFs de etiquetas a productos (si los PDFs existen en disco)
 *  - Usuario admin (si no existe)
 *
 * NO restaura: clientes ni pedidos (esos eran datos transaccionales).
 *
 * Uso:
 *   npx tsx scripts/restore-catalog.ts
 */

const prisma = new PrismaClient();

// ─── Productos ───────────────────────────────────────────────────────────
const products = [
  // Jabones
  { sku: "LIL-JAB-ARR", name: "Jabón de Arroz", shortName: "Jabón Arroz", ingredients: "Arroz molido, aceites vegetales saponificados. Aclarante natural.", price: 4.0 },
  { sku: "LIL-JAB-CUR", name: "Jabón de Cúrcuma", shortName: "Jabón Cúrcuma", ingredients: "Cúrcuma en polvo, aceites vegetales. Antioxidante, da brillo.", price: 4.0 },
  { sku: "LIL-JAB-CAR", name: "Jabón de Carbón Activado", shortName: "Jabón Carbón", ingredients: "Carbón activado, aceites vegetales. Desintoxicante.", price: 4.0 },
  { sku: "LIL-JAB-CAF", name: "Jabón de Café", shortName: "Jabón Café", ingredients: "Café molido, aceites vegetales. Exfoliante y estimulante.", price: 4.0 },
  { sku: "LIL-JAB-NAR", name: "Jabón de Naranja", shortName: "Jabón Naranja", ingredients: "Esencia de naranja, vitamina C, aceites vegetales.", price: 4.0 },
  { sku: "LIL-JAB-ROM", name: "Jabón de Romero", shortName: "Jabón Romero", ingredients: "Romero, aceites vegetales. Tonificante.", price: 4.0 },
  { sku: "LIL-JAB-LAV", name: "Jabón de Lavanda", shortName: "Jabón Lavanda", ingredients: "Lavanda, aceites vegetales. Relajante.", price: 4.0 },
  { sku: "LIL-JAB-ROS", name: "Jabón de Rosas", shortName: "Jabón Rosas", ingredients: "Pétalos de rosa, aceites vegetales. Suavizante.", price: 4.0 },
  { sku: "LIL-JAB-SAB", name: "Jabón de Sábila", shortName: "Jabón Sábila", ingredients: "Sábila (aloe vera), aceites vegetales. Hidratante y calmante.", price: 4.0 },
  { sku: "LIL-JAB-ALU", name: "Jabón de Piedra de Alumbre", shortName: "Jabón Alumbre", ingredients: "Piedra de alumbre, aceites vegetales. Desodorante y cicatrizante.", price: 4.5 },
  { sku: "LIL-JAB-PEP", name: "Jabón de Pepino", shortName: "Jabón Pepino", ingredients: "Pepino, aceites vegetales. Hidratación fresca.", price: 4.0 },
  { sku: "LIL-JAB-COC", name: "Jabón de Coco", shortName: "Jabón Coco", ingredients: "Aceite de coco virgen, aceites vegetales. Nutrición profunda.", price: 4.0 },
  { sku: "LIL-JAB-MAR", name: "Jabón de Maracuyá", shortName: "Jabón Maracuyá", ingredients: "Esencia de maracuyá, aceites vegetales. Exótico y fresco.", price: 4.5 },
  { sku: "LIL-JAB-MMA", name: "Jabón de Manzanilla y Miel de Abejas", shortName: "Jabón Manz. y Miel", ingredients: "Manzanilla, miel de abejas, aceites vegetales saponificados. Calmante y nutritivo.", price: 4.0 },

  // Extras
  { sku: "LIL-EXT-AMI", name: "Agua Micelar", shortName: "Agua Micelar", ingredients: "Agua micelar artesanal para limpieza facial.", price: 7.0, shelfLifeMonths: 12 },
  { sku: "LIL-EXT-CCN", name: "Crema de Concha de Nácar", shortName: "Crema Nácar", ingredients: "Concha de nácar, regeneradora cutánea.", price: 9.0, shelfLifeMonths: 12 },
  { sku: "LIL-EXT-SHA", name: "Shampoo Artesanal", shortName: "Shampoo", ingredients: "Shampoo artesanal de línea herbal.", price: 8.0, shelfLifeMonths: 10 },
  { sku: "LIL-EXT-PAC", name: "Perfume en Aceite", shortName: "Perfume Aceite", ingredients: "Perfume artesanal en base aceite (notas cítricas/herbales).", price: 10.0, shelfLifeMonths: 24 },
  { sku: "LIL-EXT-ACO", name: "Acondicionador Artesanal", shortName: "Acondicionador", ingredients: "Acondicionador artesanal complementario al shampoo.", price: 8.0, shelfLifeMonths: 10 },
  { sku: "LIL-EXT-PVA", name: "Perfume Vaselinado", shortName: "Perfume Vaselina", ingredients: "Perfume en base vaselinada, ideal para viaje.", price: 7.0, shelfLifeMonths: 24 },
  { sku: "LIL-EXT-CRB", name: "Crema Blanqueadora", shortName: "Crema Blanq.", ingredients: "Crema aclarante de uso facial/corporal.", price: 9.0, shelfLifeMonths: 12 },
];

// ─── Packs ───────────────────────────────────────────────────────────────
const packs = [
  {
    sku: "LIL-PACK-LUM",
    name: "Pack Ritual de Luminosidad",
    description: "Cuidado facial. Para unificar el tono y limpieza profunda pero delicada. Incluye jabones de arroz, cúrcuma y carbón activado + agua micelar + crema de concha de nácar.",
    price: 24.0,
    skus: ["LIL-JAB-ARR", "LIL-JAB-CUR", "LIL-JAB-CAR", "LIL-EXT-AMI", "LIL-EXT-CCN"],
  },
  {
    sku: "LIL-PACK-ENE",
    name: "Pack Energía y Renovación",
    description: "Exfoliación y vitalidad para el uso matutino. Jabones de café, naranja y romero + shampoo artesanal + perfume en aceite.",
    price: 26.0,
    skus: ["LIL-JAB-CAF", "LIL-JAB-NAR", "LIL-JAB-ROM", "LIL-EXT-SHA", "LIL-EXT-PAC"],
  },
  {
    sku: "LIL-PACK-SER",
    name: "Pack Serenidad y Calma",
    description: "Relajación nocturna y autocuidado. Jabones de lavanda, rosas y sábila + acondicionador artesanal + perfume vaselinado.",
    price: 23.0,
    skus: ["LIL-JAB-LAV", "LIL-JAB-ROS", "LIL-JAB-SAB", "LIL-EXT-ACO", "LIL-EXT-PVA"],
  },
  {
    sku: "LIL-PACK-PUR",
    name: "Pack Pureza Natural",
    description: "Protección y cuidado diario, ingredientes clásicos. Jabones de piedra de alumbre, pepino y coco + crema blanqueadora + shampoo artesanal.",
    price: 25.0,
    skus: ["LIL-JAB-ALU", "LIL-JAB-PEP", "LIL-JAB-COC", "LIL-EXT-CRB", "LIL-EXT-SHA"],
  },
  {
    sku: "LIL-PACK-VIA",
    name: "Pack Viajero Artesano",
    description: "Esenciales de viaje, premium y compacto. Jabones de maracuyá, coco y carbón activado + perfume vaselinado + agua micelar.",
    price: 22.0,
    skus: ["LIL-JAB-MAR", "LIL-JAB-COC", "LIL-JAB-CAR", "LIL-EXT-PVA", "LIL-EXT-AMI"],
  },
];

// ─── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══ Restauración de catálogo LILUS ═══\n");

  // 1) Settings
  console.log("1) Settings…");
  const settings: { key: string; value: string }[] = [
    { key: "brand_name", value: "LILUS" },
    { key: "sender_name", value: "LILUS Jabones Artesanales" },
    { key: "sender_phone", value: "" },
    { key: "sender_address", value: "Quito, Ecuador" },
    { key: "order_prefix", value: "LILUS" },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log(`   ✓ ${settings.length} settings`);

  // 2) Zonas
  console.log("\n2) Zonas de envío…");
  const quito = await prisma.shippingZone.upsert({
    where: { name: "Quito" },
    update: {},
    create: { name: "Quito", isDefault: true },
  });
  const fueraQuito = await prisma.shippingZone.upsert({
    where: { name: "Fuera de Quito" },
    update: {},
    create: { name: "Fuera de Quito" },
  });
  console.log("   ✓ Quito, Fuera de Quito");

  // 3) Transportadora
  console.log("\n3) Transportadora…");
  const servientrega = await prisma.carrier.upsert({
    where: { name: "Servientrega" },
    update: {
      trackingUrlTemplate: "https://www.servientrega.com.ec/Tracking/?guia={tracking}&tipo=GUIA",
    },
    create: {
      name: "Servientrega",
      trackingUrlTemplate: "https://www.servientrega.com.ec/Tracking/?guia={tracking}&tipo=GUIA",
    },
  });
  console.log("   ✓ Servientrega");

  // 4) Tarifas
  console.log("\n4) Tarifas de envío…");
  await prisma.shippingRate.upsert({
    where: { zoneId_carrierId: { zoneId: quito.id, carrierId: servientrega.id } },
    update: {},
    create: { zoneId: quito.id, carrierId: servientrega.id, price: 3.5 },
  });
  await prisma.shippingRate.upsert({
    where: { zoneId_carrierId: { zoneId: fueraQuito.id, carrierId: servientrega.id } },
    update: {},
    create: { zoneId: fueraQuito.id, carrierId: servientrega.id, price: 5.5 },
  });
  console.log("   ✓ Quito $3.50 · Fuera Quito $5.50");

  // 5) Productos
  console.log("\n5) Productos…");
  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        shortName: p.shortName,
        ingredients: p.ingredients,
        price: p.price,
        shelfLifeMonths: p.shelfLifeMonths ?? 12,
      },
      create: {
        sku: p.sku,
        name: p.name,
        shortName: p.shortName,
        ingredients: p.ingredients,
        price: p.price,
        shelfLifeMonths: p.shelfLifeMonths ?? 12,
        isActive: true,
      },
    });
  }
  console.log(`   ✓ ${products.length} productos`);

  // 6) Packs
  console.log("\n6) Packs…");
  const allProducts = await prisma.product.findMany({
    where: { sku: { in: products.map((p) => p.sku) } },
    select: { id: true, sku: true },
  });
  const idBySku = new Map(allProducts.map((p) => [p.sku, p.id]));

  for (const pk of packs) {
    const existing = await prisma.pack.findUnique({ where: { sku: pk.sku } });
    if (existing) {
      await prisma.packItem.deleteMany({ where: { packId: existing.id } });
      await prisma.pack.update({
        where: { id: existing.id },
        data: {
          name: pk.name,
          description: pk.description,
          price: pk.price,
          isActive: true,
          items: {
            create: pk.skus.map((s) => ({ productId: idBySku.get(s)!, quantity: 1 })),
          },
        },
      });
    } else {
      await prisma.pack.create({
        data: {
          sku: pk.sku,
          name: pk.name,
          description: pk.description,
          price: pk.price,
          isActive: true,
          items: {
            create: pk.skus.map((s) => ({ productId: idBySku.get(s)!, quantity: 1 })),
          },
        },
      });
    }
  }
  console.log(`   ✓ ${packs.length} packs`);

  // 7) Etiquetas (label-mapping.json)
  console.log("\n7) PDFs de etiquetas…");
  try {
    const mappingPath = path.join(process.cwd(), "scripts", "label-mapping.json");
    const raw = await readFile(mappingPath, "utf-8");
    const mapping = JSON.parse(raw) as { sku: string; labelPdfUrl: string }[];

    let okCount = 0;
    let missingFile = 0;
    for (const m of mapping) {
      const fullPath = path.join(process.cwd(), "public", m.labelPdfUrl);
      try {
        await access(fullPath);
      } catch {
        missingFile++;
        continue;
      }
      const res = await prisma.product.updateMany({
        where: { sku: m.sku },
        data: { labelPdfUrl: m.labelPdfUrl },
      });
      if (res.count > 0) okCount++;
    }
    console.log(`   ✓ ${okCount}/${mapping.length} etiquetas asociadas`);
    if (missingFile > 0) {
      console.log(`   ⚠ ${missingFile} PDFs no están en public/uploads/product-labels/`);
      console.log("     (los productos quedan sin etiqueta; súbelos desde la UI)");
    }
  } catch (e) {
    console.log(`   ⚠ No se pudo aplicar label-mapping.json: ${(e as Error).message}`);
  }

  // 8) Usuario admin
  console.log("\n8) Usuario admin…");
  const adminExists = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!adminExists) {
    await prisma.user.create({
      data: {
        username: "admin",
        name: "Administrador LILUS",
        passwordHash: await bcrypt.hash("lilus2026", 10),
        role: "admin",
      },
    });
    console.log("   ✓ admin / lilus2026 (creado)");
  } else {
    console.log("   ✓ admin ya existe (no se modifica)");
  }

  // ─── Resumen final ─────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("  ✔ Catálogo restaurado");
  console.log("═══════════════════════════════════════════════");
  const counts = {
    Settings: await prisma.setting.count(),
    Zonas: await prisma.shippingZone.count(),
    Transportadoras: await prisma.carrier.count(),
    Tarifas: await prisma.shippingRate.count(),
    Productos: await prisma.product.count(),
    Packs: await prisma.pack.count(),
    "Items de pack": await prisma.packItem.count(),
    Usuarios: await prisma.user.count(),
  };
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }
  console.log("\n  No restaurado (datos transaccionales perdidos):");
  console.log("    · Clientes y direcciones");
  console.log("    · Pedidos y unidades de producción");
  console.log("    · Print jobs históricos");
}

main()
  .catch((e) => {
    console.error("✗ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
