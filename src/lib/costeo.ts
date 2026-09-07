import { prisma } from "./prisma";

/**
 * Cuánto cuesta producir cada cosa.
 *
 * La cuenta es simple de decir y llena de detalles al hacerla:
 *
 *   costo por unidad = (materia prima de la tanda / unidades que rinde)
 *                      + el empaque de esa unidad
 *
 * Lo difícil está en el medio. Las recetas están escritas para cocinar
 * —"250 g", "10 gotas", "1/2 cucharadita"— y las facturas vienen en otra
 * cosa —"$5 el kilo", "$1 el litro"—. Este archivo es el puente.
 *
 * ── Qué NO incluye ──
 *
 * El tiempo de trabajo. Es el costo más grande de un producto artesanal y
 * el que nunca aparece en una factura, así que hay que tenerlo presente al
 * mirar estos números: son el piso, no el costo real.
 */

// ──────────────────────────────────────────────────────────
// Unidades
// ──────────────────────────────────────────────────────────

type Familia = "masa" | "volumen" | "longitud" | "conteo";

/** A cuánto equivale una unidad en la base de su familia (g, ml, m, unidad). */
const UNIDADES: Record<string, { familia: Familia; factor: number }> = {
  g: { familia: "masa", factor: 1 },
  kg: { familia: "masa", factor: 1000 },
  mg: { familia: "masa", factor: 0.001 },
  ml: { familia: "volumen", factor: 1 },
  l: { familia: "volumen", factor: 1000 },
  cc: { familia: "volumen", factor: 1 },
  m: { familia: "longitud", factor: 1 },
  cm: { familia: "longitud", factor: 0.01 },
  unidad: { familia: "conteo", factor: 1 },
  u: { familia: "conteo", factor: 1 },
};

function normalizarUnidad(u: string) {
  return UNIDADES[u.trim().toLowerCase()] ?? null;
}

/**
 * Cuánto pesa o mide algo, llevado a la unidad base de su familia.
 *
 * Devuelve null cuando no se puede saber: "Cantidad necesaria", "1 taza",
 * "Para rociar". No se inventa un número — un costo a medias con un valor
 * inventado adentro es peor que un costo que avisa que está incompleto.
 */
export function medir(
  texto: string | null
): { cantidad: number; familia: Familia; exacto: boolean } | null {
  if (!texto) return null;
  const t = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

  const num = "([\\d]+(?:[.,][\\d]+)?|[\\d]+\\s*/\\s*[\\d]+)";

  const directa = t.match(new RegExp(`^${num}\\s*(kg|mg|g|ml|l|cc|cm|m)\\b`));
  if (directa) {
    const u = normalizarUnidad(directa[2])!;
    return { cantidad: aNumero(directa[1]) * u.factor, familia: u.familia, exacto: true };
  }

  // Aproximaciones de cocina. Se marcan como no exactas para poder decir
  // "este costo tiene una estimación adentro".
  const gotas = t.match(new RegExp(`^${num}\\s*gotas?`));
  if (gotas) return { cantidad: aNumero(gotas[1]) * GOTA_ML, familia: "volumen", exacto: false };

  const cucharadita = t.match(new RegExp(`^${num}\\s*cucharadita`));
  if (cucharadita) return { cantidad: aNumero(cucharadita[1]) * CUCHARADITA_ML, familia: "volumen", exacto: false };

  const cucharada = t.match(new RegExp(`^${num}\\s*cucharada`));
  if (cucharada) return { cantidad: aNumero(cucharada[1]) * CUCHARADA_ML, familia: "volumen", exacto: false };

  return null;
}

/**
 * Equivalencias de cocina.
 *
 * Son aproximaciones honestas, no medidas. Cuando se pese una gota de cada
 * cosa con la gramera estos números se afinan; mientras tanto, todo lo que
 * los use queda marcado como estimado.
 */
export const GOTA_ML = 0.05;
export const CUCHARADITA_ML = 5;
export const CUCHARADA_ML = 15;

function aNumero(s: string) {
  if (s.includes("/")) {
    const [a, b] = s.split("/");
    return Number(a.trim()) / Number(b.trim());
  }
  return Number(s.replace(",", "."));
}

// ──────────────────────────────────────────────────────────
// Precio de las materias primas
// ──────────────────────────────────────────────────────────

export type PrecioMaterial = {
  /** $ por gramo. */
  porGramo: number | null;
  /** $ por unidad, para lo que se cuenta (frascos, cajas). */
  porUnidad: number | null;
  /** $ por metro, para lo que se mide (film, kraft). */
  porMetro: number | null;
  estimado: boolean;
  compras: number;
};

/**
 * Precio de referencia de cada material, sacado de sus compras.
 *
 * Se usa el **promedio** de los lotes y no el último. El último sería más
 * fiel a lo que costaría reponer hoy, pero con siete fragancias distintas
 * cargadas como lotes del mismo material, "el último" sería la que se
 * compró al final y no dice nada. El promedio responde a la pregunta que
 * de verdad importa: cuánto me cuesta, en general, la fragancia.
 */
export async function preciosDeMateriales(): Promise<Map<string, PrecioMaterial>> {
  const materiales = await prisma.material.findMany({
    include: { lots: { where: { price: { not: null }, quantity: { not: null } } } },
  });

  const mapa = new Map<string, PrecioMaterial>();

  for (const m of materiales) {
    if (m.lots.length === 0) continue;

    const densidad = m.density ?? 1;
    const porGramo: number[] = [];
    const porUnidad: number[] = [];
    const porMetro: number[] = [];
    let estimado = false;

    for (const lote of m.lots) {
      const u = normalizarUnidad(lote.unit ?? "");
      if (!u || !lote.price || !lote.quantity) continue;
      if (lote.notes?.includes("ESTIMADO")) estimado = true;

      const cantidadBase = lote.quantity * u.factor;
      const unitario = lote.price / cantidadBase;

      if (u.familia === "masa") porGramo.push(unitario);
      // Un litro de glicerina son 1.260 g, no 1.000. Sin la densidad el
      // costo por gramo saldría 26 % alto.
      else if (u.familia === "volumen") porGramo.push(unitario / densidad);
      else if (u.familia === "longitud") porMetro.push(unitario);
      else porUnidad.push(unitario);
    }

    const media = (xs: number[]) =>
      xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

    mapa.set(m.id, {
      porGramo: media(porGramo),
      porUnidad: media(porUnidad),
      porMetro: media(porMetro),
      estimado,
      compras: m.lots.length,
    });
  }

  return mapa;
}

// ──────────────────────────────────────────────────────────
// Costo de un producto
// ──────────────────────────────────────────────────────────

export type LineaCosto = {
  nombre: string;
  cantidad: string | null;
  costo: number | null;
  /** Por qué no se pudo costear, cuando corresponde. */
  problema?: "sin-precio" | "sin-cantidad";
  estimado: boolean;
};

export type CostoProducto = {
  productId: string;
  sku: string;
  nombre: string;
  precio: number;
  /** Materia prima por unidad. Null si la receta no permite calcularlo. */
  materiaPrima: number | null;
  empaque: number;
  total: number | null;
  /** Cuántas unidades rinde la tanda. */
  rinde: number | null;
  margen: number | null;
  /** Porcentaje del precio que se va en costo. */
  porcentaje: number | null;
  lineas: LineaCosto[];
  empaqueLineas: LineaCosto[];
  /** Qué falta para que el número sea confiable. */
  avisos: string[];
};

/**
 * Costea todos los productos que están a la venta.
 *
 * Los que no tienen receta o no tienen rinde devuelven el empaque y un
 * aviso, en vez de un cero: cero costo es una mentira que se propaga al
 * margen y a los packs.
 */
export async function costearProductos(): Promise<CostoProducto[]> {
  const precios = await preciosDeMateriales();

  // Todas las recetas, para poder costear las que se usan dentro de otras
  // —el bloqueador de humedad, la crema base— sin volver a la base de
  // datos una vez por cada uso.
  const todas = await prisma.recipe.findMany({
    include: { ingredients: { orderBy: { sortOrder: "asc" } } },
  });
  const porReceta = new Map(todas.map((r) => [r.id, r.ingredients]));
  const costoPorGramo = hacerCostoPorGramo(porReceta, precios);

  const productos = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      recipes: {
        where: { isActive: true },
        include: { ingredients: { orderBy: { sortOrder: "asc" } } },
      },
      packaging: { include: { material: true } },
    },
    orderBy: { name: "asc" },
  });

  return productos.map((p) => {
    const avisos: string[] = [];

    // ── Empaque ──
    let empaque = 0;
    const empaqueLineas: LineaCosto[] = [];
    for (const e of p.packaging) {
      const precio = precios.get(e.materialId);
      const u = normalizarUnidad(e.unit);
      let costo: number | null = null;
      if (precio && u) {
        if (u.familia === "conteo") costo = (precio.porUnidad ?? 0) * e.quantity;
        else if (u.familia === "longitud") costo = (precio.porMetro ?? 0) * e.quantity * u.factor;
        else if (u.familia === "masa") costo = (precio.porGramo ?? 0) * e.quantity * u.factor;
      }
      if (costo != null) empaque += costo;
      else avisos.push(`Sin precio para el empaque: ${e.material.name}`);
      empaqueLineas.push({
        nombre: e.material.name,
        cantidad: `${e.quantity} ${e.unit}`,
        costo,
        problema: costo == null ? "sin-precio" : undefined,
        estimado: precio?.estimado ?? false,
      });
    }

    // ── Materia prima ──
    const receta = p.recipes[0] ?? null;
    if (!receta) {
      avisos.push("No tiene receta, así que no se puede costear el contenido");
      return {
        productId: p.id, sku: p.sku, nombre: p.name, precio: p.price,
        materiaPrima: null, empaque, total: null, rinde: null,
        margen: null, porcentaje: null, lineas: [], empaqueLineas, avisos,
      };
    }

    const { lineas, total: tanda, incompleta, estimada } = costearTanda(
      receta.ingredients,
      precios,
      costoPorGramo
    );

    if (incompleta > 0) {
      avisos.push(`${incompleta} ingrediente(s) sin precio o sin cantidad clara`);
    }
    if (estimada) {
      avisos.push("Incluye equivalencias aproximadas (gotas, cucharadas)");
    }

    const rinde = receta.unitsPerBatch;
    if (!rinde) {
      avisos.push("Falta saber cuántas unidades rinde una tanda");
    }

    const materiaPrima = rinde ? tanda / rinde : null;
    const total = materiaPrima != null ? materiaPrima + empaque : null;

    return {
      productId: p.id, sku: p.sku, nombre: p.name, precio: p.price,
      materiaPrima, empaque, total, rinde,
      margen: total != null ? p.price - total : null,
      porcentaje: total != null && p.price > 0 ? (total / p.price) * 100 : null,
      lineas, empaqueLineas, avisos,
    };
  });
}

type IngredienteCosteable = {
  id: string;
  name: string;
  quantity: string | null;
  materialId: string | null;
  linkedRecipeId: string | null;
  optionGroup: string | null;
  isRecommended: boolean;
  variant: string | null;
};

/**
 * Cuánto cuesta un gramo de una receta que se usa dentro de otra.
 *
 * El bloqueador de humedad y la crema base no se compran: se hacen. Su
 * precio no está en ninguna factura y hay que sacarlo de sus propios
 * ingredientes. El peso de la tanda se calcula sumando lo que entra, que
 * para una mezcla líquida es exacto.
 *
 * Va con memoria y con tope de profundidad: la crema base entra en cuatro
 * recetas y no hay por qué recalcularla cuatro veces, y una receta que se
 * incluyera a sí misma daría vueltas para siempre.
 */
function hacerCostoPorGramo(
  recetas: Map<string, IngredienteCosteable[]>,
  precios: Map<string, PrecioMaterial>
) {
  const memoria = new Map<string, number | null>();

  return function costoPorGramo(recipeId: string, profundidad = 0): number | null {
    if (profundidad > 4) return null;
    if (memoria.has(recipeId)) return memoria.get(recipeId)!;
    memoria.set(recipeId, null); // corta ciclos mientras se calcula

    const ingredientes = recetas.get(recipeId);
    if (!ingredientes) return null;

    let costo = 0;
    let gramos = 0;
    let completa = true;

    for (const i of soloUnaAlternativa(ingredientes)) {
      const medida = medir(i.quantity);
      if (!medida) {
        completa = false;
        continue;
      }
      if (medida.familia === "masa" || medida.familia === "volumen") {
        gramos += medida.cantidad;
      }
      const unitario = precioUnitario(i, precios, costoPorGramo, profundidad);
      if (unitario == null) completa = false;
      else costo += medida.cantidad * unitario;
    }

    // Una receta a medias daría un precio por gramo demasiado barato, y
    // ese error se multiplicaría en todo lo que la usa.
    const resultado = completa && gramos > 0 ? costo / gramos : null;
    memoria.set(recipeId, resultado);
    return resultado;
  };
}

/** El precio por gramo (o por unidad) de un ingrediente concreto. */
function precioUnitario(
  i: IngredienteCosteable,
  precios: Map<string, PrecioMaterial>,
  costoPorGramo: (id: string, p?: number) => number | null,
  profundidad: number
): number | null {
  // Las opciones "sin nada" de un grupo de alternativas existen para poder
  // elegirlas, y elegir no poner algo no cuesta.
  if (/^sin\s/i.test(i.name.trim())) return 0;

  if (i.linkedRecipeId) return costoPorGramo(i.linkedRecipeId, profundidad + 1);

  const precio = i.materialId ? precios.get(i.materialId) : undefined;
  if (!precio) return null;
  return precio.porGramo ?? precio.porUnidad ?? null;
}

/** De cada grupo de alternativas, la recomendada. */
function soloUnaAlternativa(ingredientes: IngredienteCosteable[]) {
  const grupos = new Set<string>();
  return ingredientes.filter((i) => {
    if (!i.optionGroup) return true;
    if (grupos.has(i.optionGroup)) return false;
    const g = ingredientes.filter((x) => x.optionGroup === i.optionGroup);
    if ((g.find((x) => x.isRecommended) ?? g[0]).id !== i.id) return false;
    grupos.add(i.optionGroup);
    return true;
  });
}

/** Suma lo que cuesta una tanda de receta, eligiendo una sola alternativa por grupo. */
function costearTanda(
  ingredientes: IngredienteCosteable[],
  precios: Map<string, PrecioMaterial>,
  costoPorGramo: (id: string, p?: number) => number | null
) {
  // Sumar todas las alternativas costearía tres conservantes cuando solo
  // se usa uno.
  const usar = soloUnaAlternativa(ingredientes);

  const lineas: LineaCosto[] = [];
  let total = 0;
  let incompleta = 0;
  let estimada = false;

  for (const i of usar) {
    const medida = medir(i.quantity);
    const unitario = precioUnitario(i, precios, costoPorGramo, 0);

    let costo: number | null = null;
    let problema: LineaCosto["problema"];

    if (!medida) problema = "sin-cantidad";
    else if (unitario == null) problema = "sin-precio";
    else {
      // Las gotas y los mililitros se cobran como gramos: es una
      // aproximación, pero para 10 gotas de algo el error es invisible al
      // lado de lo que cuesta la base.
      costo = medida.cantidad * unitario;
      if (!medida.exacto) estimada = true;
    }

    if (costo != null) total += costo;
    else incompleta++;

    const precio = i.materialId ? precios.get(i.materialId) : undefined;
    lineas.push({
      nombre: i.name,
      cantidad: i.quantity,
      costo,
      problema,
      estimado: (precio?.estimado ?? false) || (medida ? !medida.exacto : false),
    });
  }

  return { lineas, total, incompleta, estimada };
}

// ──────────────────────────────────────────────────────────
// Costo de un pack
// ──────────────────────────────────────────────────────────

export type CostoPack = {
  packId: string;
  sku: string;
  nombre: string;
  precio: number;
  contenido: number | null;
  empaque: number;
  total: number | null;
  margen: number | null;
  porcentaje: number | null;
  /** Lo que costaría comprar sus productos por separado. */
  sueltoSuma: number;
  avisos: string[];
};

export async function costearPacks(
  costosProducto?: CostoProducto[]
): Promise<CostoPack[]> {
  const productos = costosProducto ?? (await costearProductos());
  const porId = new Map(productos.map((c) => [c.productId, c]));
  const precios = await preciosDeMateriales();

  const packs = await prisma.pack.findMany({
    where: { isActive: true },
    include: {
      items: { include: { product: true } },
      packaging: { include: { material: true } },
    },
    orderBy: { name: "asc" },
  });

  return packs.map((k) => {
    const avisos: string[] = [];

    let empaque = 0;
    for (const e of k.packaging) {
      const precio = precios.get(e.materialId);
      const u = normalizarUnidad(e.unit);
      if (!precio || !u) {
        avisos.push(`Sin precio para el empaque: ${e.material.name}`);
        continue;
      }
      if (u.familia === "conteo") empaque += (precio.porUnidad ?? 0) * e.quantity;
      else if (u.familia === "longitud") empaque += (precio.porMetro ?? 0) * e.quantity * u.factor;
      else if (u.familia === "masa") empaque += (precio.porGramo ?? 0) * e.quantity * u.factor;
    }

    let contenido: number | null = 0;
    let sueltoSuma = 0;
    for (const item of k.items) {
      const c = porId.get(item.productId);
      sueltoSuma += item.product.price * item.quantity;
      if (!c || c.total == null) {
        avisos.push(`Falta el costo de ${item.product.name}`);
        contenido = null;
        continue;
      }
      if (contenido != null) contenido += c.total * item.quantity;
    }

    const total = contenido != null ? contenido + empaque : null;

    return {
      packId: k.id, sku: k.sku, nombre: k.name, precio: k.price,
      contenido, empaque, total,
      margen: total != null ? k.price - total : null,
      porcentaje: total != null && k.price > 0 ? (total / k.price) * 100 : null,
      sueltoSuma, avisos,
    };
  });
}

/**
 * Guarda el costo calculado en `productionCost`.
 *
 * Se guarda además de calcularse al vuelo porque los pedidos viejos tienen
 * que poder decir cuánto costó lo que se vendió *entonces*. Si el precio de
 * la base sube, el margen de un pedido de marzo no debería moverse.
 */
export async function guardarCostos() {
  const productos = await costearProductos();
  const packs = await costearPacks(productos);

  let guardados = 0;
  for (const c of productos) {
    if (c.total == null) continue;
    await prisma.product.update({
      where: { id: c.productId },
      data: { productionCost: Number(c.total.toFixed(4)) },
    });
    guardados++;
  }
  for (const c of packs) {
    if (c.total == null) continue;
    await prisma.pack.update({
      where: { id: c.packId },
      data: { productionCost: Number(c.total.toFixed(4)) },
    });
    guardados++;
  }
  return { guardados, productos, packs };
}
