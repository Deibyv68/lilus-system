import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { costearProductos, costearPacks } from "../src/lib/costeo";

/**
 * Muestra el costo calculado de todo, sin guardarlo.
 *
 *   npx tsx scripts/ver-costos.ts
 */
const prisma = new PrismaClient();

const d = (n: number | null, ancho = 6) =>
  n == null ? "—".padStart(ancho) : ("$" + n.toFixed(2)).padStart(ancho);

async function main() {
  const productos = await costearProductos();
  const packs = await costearPacks(productos);

  console.log("\n═══ PRODUCTOS ═══\n");
  console.log(
    "  " + "PRODUCTO".padEnd(34) + "MATERIA  EMPAQUE   COSTO   VENTA   MARGEN    %"
  );
  console.log("  " + "─".repeat(80));

  for (const c of [...productos].sort((a, b) => (b.porcentaje ?? -1) - (a.porcentaje ?? -1))) {
    console.log(
      "  " + c.nombre.padEnd(34) +
      d(c.materiaPrima) + "  " + d(c.empaque) + "  " + d(c.total) + "  " +
      d(c.precio) + "  " + d(c.margen) + "  " +
      (c.porcentaje == null ? "   —" : (c.porcentaje.toFixed(0) + " %").padStart(5))
    );
  }

  console.log("\n═══ PACKS ═══\n");
  console.log(
    "  " + "PACK".padEnd(34) + "CONTEN.  EMPAQUE   COSTO   VENTA   MARGEN    %"
  );
  console.log("  " + "─".repeat(80));
  for (const c of packs) {
    console.log(
      "  " + c.nombre.padEnd(34) +
      d(c.contenido) + "  " + d(c.empaque) + "  " + d(c.total) + "  " +
      d(c.precio) + "  " + d(c.margen) + "  " +
      (c.porcentaje == null ? "   —" : (c.porcentaje.toFixed(0) + " %").padStart(5))
    );
  }

  console.log("\n═══ LO QUE FALTA ═══\n");
  for (const c of [...productos, ...packs]) {
    if (c.avisos.length === 0) continue;
    console.log("  " + c.nombre);
    for (const a of c.avisos) console.log("     · " + a);
  }
  console.log("");
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
