import "dotenv/config";
import { PDFDocument } from "pdf-lib";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Mapear UUID → SKU para reportes más legibles
  const products = await prisma.product.findMany({
    where: { labelPdfUrl: { not: null } },
    select: { sku: true, name: true, labelPdfUrl: true },
  });
  const skuByPath = new Map(
    products.map((p) => [p.labelPdfUrl!, { sku: p.sku, name: p.name }])
  );

  const dir = path.join(process.cwd(), "public", "uploads", "product-labels");
  const files = await readdir(dir);

  console.log(`Inspeccionando ${files.length} PDFs en ${dir}\n`);
  console.log(
    "SKU            | Tamaño en pt        | En pulgadas       | En cm"
  );
  console.log("─".repeat(80));

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const buf = await readFile(fullPath);
    let info: string = "(error leyendo)";
    try {
      const doc = await PDFDocument.load(buf);
      const { width, height } = doc.getPage(0).getSize();
      const wIn = (width / 72).toFixed(2);
      const hIn = (height / 72).toFixed(2);
      const wCm = ((width / 72) * 2.54).toFixed(2);
      const hCm = ((height / 72) * 2.54).toFixed(2);
      info = `${width.toFixed(0).padEnd(5)} × ${height.toFixed(0).padEnd(5)}pt   | ${wIn}" × ${hIn}"      | ${wCm} × ${hCm} cm`;
    } catch (e) {
      info = `(error: ${(e as Error).message})`;
    }

    const meta = skuByPath.get(`/uploads/product-labels/${file}`);
    const label = meta ? meta.sku.padEnd(14) : "(sin asignar)".padEnd(14);
    console.log(`${label} | ${info}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
