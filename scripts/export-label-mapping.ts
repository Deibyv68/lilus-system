import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { labelPdfUrl: { not: null } },
    select: { sku: true, labelPdfUrl: true },
  });
  await writeFile(
    "scripts/label-mapping.json",
    JSON.stringify(products, null, 2)
  );
  console.log(`✓ Exportados ${products.length} mappings → scripts/label-mapping.json`);
  products.forEach((p) => console.log(`  ${p.sku} → ${p.labelPdfUrl}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
