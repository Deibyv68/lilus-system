import { buildExpiryLabelPdf } from "@/lib/pdf-expiry-label";
import { renderPdfToPng } from "@/lib/pdf-to-png";
import { writeFile } from "node:fs/promises";

/**
 * Renderiza una etiqueta de caducidad de ejemplo a PNG para revisarla sin
 * tener que imprimir ni levantar la app.
 *
 *   npx tsx scripts/render-expiry-preview.ts [salida.png]
 */
const SAMPLE = [
  ["Jabón de Manzanilla y Miel", "LIL-JAB-MMA", "L20260726-001"],
  ["Jabón de Café", "LIL-JAB-CAF", "L20260726-002"],
  ["Crema de Concha de Nácar", "LIL-EXT-CCN", "L20260726-003"],
];

async function main() {
  const out = process.argv[2] ?? "etiqueta-caducidad-preview.png";

  const bytes = await buildExpiryLabelPdf(
    SAMPLE.map(([productName, sku, batchCode]) => ({
      productName,
      sku,
      batchCode,
      manufactureDate: new Date(2026, 6, 26),
      expiryDate: new Date(2027, 6, 26),
    }))
  );

  const png = await renderPdfToPng(Buffer.from(bytes), 6);
  await writeFile(out, png);
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
