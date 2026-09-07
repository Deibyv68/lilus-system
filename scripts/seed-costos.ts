import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  COMPRAS,
  DENSIDADES,
  ENVASES,
  EMPAQUE_POR_PRODUCTO,
  EMPAQUE_POR_PACK,
  RINDES,
} from "../prisma/costos-data";
import { guardarCostos } from "../src/lib/costeo";

/**
 * Carga los precios de compra y conecta las recetas con el inventario.
 *
 * Es idempotente: borra los lotes y el empaque que él mismo creó y los
 * vuelve a poner. No toca los lotes que se hayan cargado a mano desde el
 * panel — esos se distinguen porque no llevan la marca.
 *
 *   npx tsx scripts/seed-costos.ts
 */

const MARCA = "[carga inicial]";
const prisma = new PrismaClient();

/** Compara nombres sin importar mayúsculas, tildes ni puntuación suelta. */
function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("═══ Costos de producción ═══\n");

  // ── 1. Envases como materias primas ──
  for (const e of ENVASES) {
    await prisma.material.upsert({
      where: { slug: e.slug },
      update: { name: e.name, purpose: e.purpose },
      create: {
        slug: e.slug,
        name: e.name,
        purpose: e.purpose,
        category: "envase",
      },
    });
  }
  console.log(`✓ ${ENVASES.length} envases en el inventario`);

  // ── 2. Densidades ──
  let densidades = 0;
  for (const [slug, d] of Object.entries(DENSIDADES)) {
    const m = await prisma.material.findUnique({ where: { slug } });
    if (!m) {
      console.log(`   ⚠ no existe el material ${slug}`);
      continue;
    }
    await prisma.material.update({ where: { id: m.id }, data: { density: d } });
    densidades++;
  }
  console.log(`✓ ${densidades} densidades`);

  // ── 3. Compras ──
  await prisma.materialLot.deleteMany({ where: { notes: { contains: MARCA } } });

  const compras = [
    ...COMPRAS,
    ...ENVASES.map((e) => ({ slug: e.slug, ...e.compra })),
  ];

  let cargadas = 0;
  const sinMaterial: string[] = [];
  for (const c of compras) {
    const m = await prisma.material.findUnique({ where: { slug: c.slug } });
    if (!m) {
      sinMaterial.push(c.slug);
      continue;
    }
    await prisma.materialLot.create({
      data: {
        materialId: m.id,
        quantity: c.quantity,
        unit: c.unit,
        price: c.price,
        supplier: c.supplier ?? null,
        status: "abierto",
        notes: [c.estimado ? "ESTIMADO." : null, c.notes, MARCA]
          .filter(Boolean)
          .join(" "),
      },
    });
    cargadas++;
  }
  console.log(`✓ ${cargadas} compras cargadas`);
  if (sinMaterial.length) {
    console.log(`   ⚠ sin material: ${sinMaterial.join(", ")}`);
  }

  // ── 4. Recetas: rinde ──
  let rindes = 0;
  for (const [slug, n] of Object.entries(RINDES)) {
    const r = await prisma.recipe.findUnique({ where: { slug } });
    if (!r) {
      console.log(`   ⚠ no existe la receta ${slug}`);
      continue;
    }
    await prisma.recipe.update({ where: { id: r.id }, data: { unitsPerBatch: n } });
    rindes++;
  }
  console.log(`✓ ${rindes} recetas con rinde`);

  // ── 5. El puente: ingrediente de receta → materia prima ──
  //
  // Se enlaza por nombre. Lo que no case queda sin enlazar y se lista al
  // final: es preferible una lista de pendientes a un enlace inventado que
  // costee un ingrediente con el precio de otro.
  const materiales = await prisma.material.findMany();
  const porNombre = new Map<string, string>();
  for (const m of materiales) {
    porNombre.set(normalizar(m.name), m.id);
    if (m.tradeName) porNombre.set(normalizar(m.tradeName), m.id);
    if (m.inciName) porNombre.set(normalizar(m.inciName), m.id);
  }

  // Nombres que la receta escribe distinto a como los llama el inventario.
  const ALIAS: Record<string, string> = {
    "aroma": "fragancia cosmetica",
    "fragancia": "fragancia cosmetica",
    "fragancia para perfume": "fragancia cosmetica",
    "aroma fresh": "fragancia cosmetica",
    "aroma suave": "fragancia cosmetica",
    "aroma adicional": "fragancia cosmetica",
    "aroma de cafe": "fragancia cosmetica",
    "aroma de rosas": "fragancia cosmetica",
    "aroma de naranja": "fragancia cosmetica",
    "aroma de sabila": "fragancia cosmetica",
    "aroma a lavanda": "fragancia cosmetica",
    "aroma de miel o de avena": "fragancia cosmetica",
    "colorante": "colorante cosmetico",
    "colorante verde": "colorante cosmetico",
    "colorante naranja": "colorante cosmetico",
    "colorante hidrosoluble": "colorante cosmetico",
    "glicerina": "glicerina usp",
    "glicerina usp liquida": "glicerina usp",
    "base de glicerina": "base de glicerina transparente",
    "base de glicerina transparente o blanca": "base de glicerina transparente",
    "caolin": "arcilla blanca caolin",
    "polvo de curcuma": "curcuma en polvo",
    "curcuma en pizca": "curcuma en polvo",
    "vaselina solida simple": "vaselina solida",
    "alcohol compuesto": "alcohol compuesto para perfumeria",
    "betaina de coco extra": "betaina de coco",
    "agua destilada caliente": "agua destilada",
    "agua destilada extra": "agua destilada",
    "aceite de silicon": "aceite de silicon dimeticona",
    "polisorbato 20": "polisorbato 20 tween 20",
    "glicerina vegetal": "glicerina usp",
    "avena molida fina": "avena molida",
    "hojuelas de avena": "avena molida",
    "colorante violeta": "colorante cosmetico",
    "colorante amarillo": "colorante cosmetico",
    "sal en grano": "bicarbonato de sodio",
    // El mismo frasco, escrito distinto en la receta y en el inventario.
    "kemidant l dmdm hydantoin": "kemidant l",
    "tween 20 polisorbato 20": "polisorbato 20 tween 20",
    "polvo de alumbre": "polvo de piedra de alumbre",
    "extracto de cebolla desodorizado": "extracto de cebolla",
    "hidrolizado de proteina de trigo": "hidrolizado de proteinas",
    "solo aceite esencial de arbol de te": "aceite esencial de arbol de te",
    // A propósito NO se enlazan el aceite de sábila con el de coco ni el
    // polyquaternium-10 con el 7: se parecen en el nombre y nada más.
    // Costear uno con el precio del otro da un número que parece bueno y
    // está mal, que es peor que no tenerlo.
  };

  const ingredientes = await prisma.recipeIngredient.findMany({
    include: { recipe: { select: { isActive: true } } },
  });

  let enlazados = 0;
  const sinEnlazar = new Map<string, number>();
  for (const i of ingredientes) {
    const clave = normalizar(i.name);
    // "Conservante" aparece 29 veces y por sí solo no dice cuál es: las
    // alternativas comparten el nombre y se distinguen por su etiqueta.
    const porEtiqueta = i.optionLabel ? porNombre.get(normalizar(i.optionLabel)) : undefined;
    const materialId =
      porNombre.get(clave) ?? porEtiqueta ?? porNombre.get(ALIAS[clave] ?? "");
    if (materialId) {
      await prisma.recipeIngredient.update({
        where: { id: i.id },
        data: { materialId },
      });
      enlazados++;
    } else if (
      i.recipe.isActive &&
      // Los que se preparan con otra receta se costean por dentro, no por
      // factura, y los "Sin X" son la opción de no poner nada. Ninguno de
      // los dos es un pendiente.
      !i.linkedRecipeId &&
      !/^sin\s/i.test(i.name.trim())
    ) {
      sinEnlazar.set(i.name, (sinEnlazar.get(i.name) ?? 0) + 1);
    }
  }
  console.log(`✓ ${enlazados} de ${ingredientes.length} ingredientes enlazados al inventario`);

  // ── 6. Empaque ──
  await prisma.packagingItem.deleteMany({ where: { notes: MARCA } });

  let empaques = 0;
  for (const e of EMPAQUE_POR_PRODUCTO) {
    const producto = await prisma.product.findUnique({ where: { sku: e.sku } });
    const material = await prisma.material.findUnique({ where: { slug: e.material } });
    if (!producto || !material) {
      console.log(`   ⚠ empaque sin destino: ${e.sku} / ${e.material}`);
      continue;
    }
    await prisma.packagingItem.create({
      data: {
        productId: producto.id,
        materialId: material.id,
        quantity: e.quantity,
        unit: e.unit,
        notes: MARCA,
      },
    });
    empaques++;
  }

  const packs = await prisma.pack.findMany();
  for (const pack of packs) {
    for (const e of EMPAQUE_POR_PACK) {
      const material = await prisma.material.findUnique({ where: { slug: e.material } });
      if (!material) continue;
      await prisma.packagingItem.create({
        data: {
          packId: pack.id,
          materialId: material.id,
          quantity: e.quantity,
          unit: e.unit,
          notes: MARCA,
        },
      });
      empaques++;
    }
  }
  console.log(`✓ ${empaques} líneas de empaque`);

  // ── 7. Guardar el costo calculado ──
  //
  // La pantalla de Costos recalcula al abrirse, pero `productionCost`
  // queda guardado igual: es el que van a mirar los pedidos ya hechos para
  // decir cuánto costó lo que se vendió entonces.
  const { guardados } = await guardarCostos();
  console.log(`✓ ${guardados} costos guardados en productos y packs`);

  // ── Pendientes ──
  if (sinEnlazar.size > 0) {
    console.log(`\n  ⚠ ${sinEnlazar.size} ingredientes de recetas activas sin materia prima:`);
    for (const [n, c] of [...sinEnlazar].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
      console.log(`     ${String(c).padStart(2)}x  ${n}`);
    }
  }

  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
