import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  // 1) Crear (o actualizar) el producto
  const product = await prisma.product.upsert({
    where: { sku: "LIL-JAB-MMA" },
    update: {},
    create: {
      sku: "LIL-JAB-MMA",
      name: "Jabón de Manzanilla y Miel de Abejas",
      shortName: "Jabón Manz. y Miel",
      ingredients:
        "Manzanilla, miel de abejas, aceites vegetales saponificados. Calmante y nutritivo.",
      price: 4.0,
      shelfLifeMonths: 12,
      isActive: true,
    },
  });
  console.log(`✓ Producto: ${product.sku} → ${product.name}`);

  // 2) Mover el PDF que el usuario dejó
  const src = path.join(process.cwd(), "incoming-labels", "MANZAN Y MIEL ABEJA  (1).pdf");
  const targetDir = path.join(process.cwd(), "public", "uploads", "product-labels");
  await mkdir(targetDir, { recursive: true });
  const newName = `${randomUUID()}.pdf`;
  const dst = path.join(targetDir, newName);
  const buf = await readFile(src);
  await writeFile(dst, buf);

  const url = `/uploads/product-labels/${newName}`;
  await prisma.product.update({
    where: { id: product.id },
    data: { labelPdfUrl: url },
  });
  console.log(`✓ Etiqueta cargada: ${url}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
