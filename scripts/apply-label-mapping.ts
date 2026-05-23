import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const mappingPath = path.join(process.cwd(), "scripts", "label-mapping.json");
  const raw = await readFile(mappingPath, "utf-8");
  const mapping = JSON.parse(raw) as { sku: string; labelPdfUrl: string }[];

  console.log(`Aplicando ${mapping.length} mappings…\n`);

  let ok = 0;
  const missing: string[] = [];
  const fileMissing: string[] = [];

  for (const m of mapping) {
    // Verificar que el archivo físico exista
    const fullPath = path.join(process.cwd(), "public", m.labelPdfUrl);
    try {
      await access(fullPath);
    } catch {
      fileMissing.push(`${m.sku} → ${m.labelPdfUrl}`);
      continue;
    }

    // Actualizar en BD
    const res = await prisma.product.updateMany({
      where: { sku: m.sku },
      data: { labelPdfUrl: m.labelPdfUrl },
    });

    if (res.count === 0) {
      missing.push(m.sku);
    } else {
      console.log(`  ✓ ${m.sku} → ${m.labelPdfUrl}`);
      ok++;
    }
  }

  console.log(`\n══════════════════════════════════`);
  console.log(`  Actualizados: ${ok}/${mapping.length}`);
  if (missing.length > 0) {
    console.log(`\n  ⚠ SKUs no encontrados en la BD:`);
    missing.forEach((s) => console.log(`     ${s}`));
  }
  if (fileMissing.length > 0) {
    console.log(`\n  ⚠ Archivos físicos faltantes:`);
    fileMissing.forEach((s) => console.log(`     ${s}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
