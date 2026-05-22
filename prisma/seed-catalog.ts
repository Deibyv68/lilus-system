import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Productos individuales (jabones + extras)
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

  // Extras
  { sku: "LIL-EXT-AMI", name: "Agua Micelar", shortName: "Agua Micelar", ingredients: "Agua micelar artesanal para limpieza facial.", price: 7.0, shelfLifeMonths: 12 },
  { sku: "LIL-EXT-CCN", name: "Crema de Concha de Nácar", shortName: "Crema Nácar", ingredients: "Concha de nácar, regeneradora cutánea.", price: 9.0, shelfLifeMonths: 12 },
  { sku: "LIL-EXT-SHA", name: "Shampoo Artesanal", shortName: "Shampoo", ingredients: "Shampoo artesanal de línea herbal.", price: 8.0, shelfLifeMonths: 10 },
  { sku: "LIL-EXT-PAC", name: "Perfume en Aceite", shortName: "Perfume Aceite", ingredients: "Perfume artesanal en base aceite (notas cítricas/herbales).", price: 10.0, shelfLifeMonths: 24 },
  { sku: "LIL-EXT-ACO", name: "Acondicionador Artesanal", shortName: "Acondicionador", ingredients: "Acondicionador artesanal complementario al shampoo.", price: 8.0, shelfLifeMonths: 10 },
  { sku: "LIL-EXT-PVA", name: "Perfume Vaselinado", shortName: "Perfume Vaselina", ingredients: "Perfume en base vaselinada, ideal para viaje.", price: 7.0, shelfLifeMonths: 24 },
  { sku: "LIL-EXT-CRB", name: "Crema Blanqueadora", shortName: "Crema Blanq.", ingredients: "Crema aclarante de uso facial/corporal.", price: 9.0, shelfLifeMonths: 12 },
];

const packs = [
  {
    sku: "LIL-PACK-LUM",
    name: "Pack Ritual de Luminosidad",
    description:
      "Cuidado facial. Para unificar el tono y limpieza profunda pero delicada. Incluye jabones de arroz, cúrcuma y carbón activado + agua micelar + crema de concha de nácar.",
    price: 24.0,
    skus: ["LIL-JAB-ARR", "LIL-JAB-CUR", "LIL-JAB-CAR", "LIL-EXT-AMI", "LIL-EXT-CCN"],
  },
  {
    sku: "LIL-PACK-ENE",
    name: "Pack Energía y Renovación",
    description:
      "Exfoliación y vitalidad para el uso matutino. Jabones de café, naranja y romero + shampoo artesanal + perfume en aceite.",
    price: 26.0,
    skus: ["LIL-JAB-CAF", "LIL-JAB-NAR", "LIL-JAB-ROM", "LIL-EXT-SHA", "LIL-EXT-PAC"],
  },
  {
    sku: "LIL-PACK-SER",
    name: "Pack Serenidad y Calma",
    description:
      "Relajación nocturna y autocuidado. Jabones de lavanda, rosas y sábila + acondicionador artesanal + perfume vaselinado.",
    price: 23.0,
    skus: ["LIL-JAB-LAV", "LIL-JAB-ROS", "LIL-JAB-SAB", "LIL-EXT-ACO", "LIL-EXT-PVA"],
  },
  {
    sku: "LIL-PACK-PUR",
    name: "Pack Pureza Natural",
    description:
      "Protección y cuidado diario, ingredientes clásicos. Jabones de piedra de alumbre, pepino y coco + crema blanqueadora + shampoo artesanal.",
    price: 25.0,
    skus: ["LIL-JAB-ALU", "LIL-JAB-PEP", "LIL-JAB-COC", "LIL-EXT-CRB", "LIL-EXT-SHA"],
  },
  {
    sku: "LIL-PACK-VIA",
    name: "Pack Viajero Artesano",
    description:
      "Esenciales de viaje, premium y compacto. Jabones de maracuyá, coco y carbón activado + perfume vaselinado + agua micelar.",
    price: 22.0,
    skus: ["LIL-JAB-MAR", "LIL-JAB-COC", "LIL-JAB-CAR", "LIL-EXT-PVA", "LIL-EXT-AMI"],
  },
];

async function main() {
  // 1) Upsert productos
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
  console.log(`✓ ${products.length} productos creados/actualizados`);

  // 2) Mapa SKU -> id
  const all = await prisma.product.findMany({
    where: { sku: { in: products.map((p) => p.sku) } },
    select: { id: true, sku: true },
  });
  const idBySku = new Map(all.map((p) => [p.sku, p.id]));

  // 3) Upsert packs (borrar items previos y recrearlos)
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
            create: pk.skus.map((s) => ({
              productId: idBySku.get(s)!,
              quantity: 1,
            })),
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
            create: pk.skus.map((s) => ({
              productId: idBySku.get(s)!,
              quantity: 1,
            })),
          },
        },
      });
    }
  }
  console.log(`✓ ${packs.length} packs creados/actualizados`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
