import { buildExpiryLabelPdf } from "@/lib/pdf-expiry-label";
import { renderPdfToPng } from "@/lib/pdf-to-png";
import { writeFile } from "node:fs/promises";

/**
 * Renderiza una etiqueta de caducidad de ejemplo a PNG para revisarla sin
 * tener que imprimir ni levantar la app.
 *
 *   npx tsx scripts/render-expiry-preview.ts [salida.png]
 */
async function main() {
  const out = process.argv[2] ?? "etiqueta-caducidad-preview.png";

  const bytes = await buildExpiryLabelPdf([
    {
      productName: "Jabón de Manzanilla y Miel",
      sku: "LIL-JAB-MMA",
      batchCode: "L20260726-001",
      manufactureDate: new Date("2026-07-26"),
      expiryDate: new Date("2027-07-26"),
    },
    {
      productName: "Jabón de Café",
      sku: "LIL-JAB-CAF",
      batchCode: "L20260726-002",
      manufactureDate: new Date("2026-07-26"),
      expiryDate: new Date("2027-07-26"),
    },
  ]);

  const png = await renderPdfToPng(Buffer.from(bytes), 6);
  await writeFile(out, png);
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
