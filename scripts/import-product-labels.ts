import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const INCOMING = path.join(process.cwd(), "incoming-labels");
const TARGET_DIR = path.join(process.cwd(), "public", "uploads", "product-labels");

async function main() {
  const files = await readdir(INCOMING).catch(() => [] as string[]);
  const pdfs = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfs.length === 0) {
    console.log("✗ No hay PDFs en /incoming-labels");
    return;
  }

  await mkdir(TARGET_DIR, { recursive: true });

  const products = await prisma.product.findMany({
    select: { id: true, sku: true, name: true, labelPdfUrl: true },
  });
  const bySku = new Map(products.map((p) => [p.sku.toLowerCase(), p]));

  let ok = 0;
  let missing: string[] = [];
  let skipped: string[] = [];

  for (const file of pdfs) {
    // El nombre del archivo (sin .pdf) debe ser el SKU
    const sku = path.basename(file, path.extname(file)).trim().toLowerCase();
    const product = bySku.get(sku);
    if (!product) {
      missing.push(file);
      continue;
    }

    // Copiar a /public/uploads/product-labels con UUID
    const newName = `${randomUUID()}.pdf`;
    const src = path.join(INCOMING, file);
    const dst = path.join(TARGET_DIR, newName);
    const buf = await readFile(src);
    await writeFile(dst, buf);

    const url = `/uploads/product-labels/${newName}`;
    await prisma.product.update({
      where: { id: product.id },
      data: { labelPdfUrl: url },
    });

    console.log(`✓ ${product.sku} → ${product.name}  (${(buf.length / 1024).toFixed(1)} KB)`);
    ok++;
  }

  // Detectar productos sin etiqueta y que tampoco recibieron PDF ahora
  const updated = new Set(
    pdfs.map((f) => path.basename(f, path.extname(f)).toLowerCase())
  );
  for (const p of products) {
    if (!updated.has(p.sku.toLowerCase()) && !p.labelPdfUrl) {
      skipped.push(`${p.sku}  (${p.name})`);
    }
  }

  console.log("");
  console.log(`Procesados: ${ok} / ${pdfs.length}`);

  if (missing.length > 0) {
    console.log(`\n⚠ Archivos cuyo nombre no coincide con ningún SKU:`);
    missing.forEach((f) => console.log(`   - ${f}`));
  }
  if (skipped.length > 0) {
    console.log(`\nℹ Productos que aún no tienen etiqueta:`);
    skipped.forEach((s) => console.log(`   - ${s}`));
  }
}

main()
  .catch((e) => {
    console.error("✗ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
