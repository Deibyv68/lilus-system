/**
 * Lo que cuesta producir: precios de compra, envases y rindes.
 *
 * Los precios salen de las facturas que la Profe Nelly fue anotando, y
 * **ya incluyen el 15 % de IVA** — es lo que sale del bolsillo. Si algún
 * día LILUS declara IVA, estos números habría que dividirlos por 1,15,
 * porque entonces el impuesto deja de ser costo y pasa a ser crédito.
 *
 * Cada compra se guarda como un lote, no como "precio del material". Así
 * queda el historial y dentro de seis meses se puede ver cuánto subió la
 * base, que es la que manda en el costo de todos los jabones.
 */

/** Gramos por mililitro, para lo que se compra por litro y se usa en gramos. */
export const DENSIDADES: Record<string, number> = {
  "agua-destilada": 1.0,
  "glicerina-usp": 1.26,
  "alcohol-compuesto": 0.81,
  "alcohol-96": 0.79,
};

export type Compra = {
  slug: string;
  quantity: number;
  unit: "g" | "ml" | "unidad" | "m";
  price: number;
  supplier?: string;
  notes?: string;
  /** Precio inventado hasta tener la factura real. Se marca para poder buscarlo. */
  estimado?: boolean;
};

const LIBRA = 453.6;

export const COMPRAS: Compra[] = [
  // ── La base: el 80 % del costo de cualquier jabón ──
  { slug: "base-glicerina-transparente", quantity: 1000, unit: "g", price: 5.0, notes: "Se compra en paquetes de 500 g" },
  { slug: "base-glicerina-blanca", quantity: 1000, unit: "g", price: 5.0, notes: "Mismo precio que la transparente" },

  // ── Líquidos ──
  { slug: "agua-destilada", quantity: 1000, unit: "ml", price: 1.0 },
  { slug: "glicerina-usp", quantity: 1000, unit: "ml", price: 2.0 },
  { slug: "alcohol-96", quantity: 50, unit: "g", price: 0.97, notes: "Para desinfectar envases y para el bloqueador de humedad" },
  { slug: "alcohol-compuesto", quantity: 1000, unit: "ml", price: 1.2, supplier: "Flora Síntesis", notes: "Ya viene compuesto para perfumería" },

  // ── Tensioactivos y grasas ──
  { slug: "betaina-coco", quantity: 250, unit: "g", price: 2.6 },
  { slug: "manteca-karite", quantity: 30, unit: "g", price: 1.6 },
  { slug: "vaselina-solida", quantity: 50, unit: "g", price: 1.78 },

  // ── Polvos y vegetales ──
  { slug: "polvo-arroz", quantity: LIBRA, unit: "g", price: 0.6 },
  { slug: "cafe-granulado", quantity: 450, unit: "g", price: 5.0 },
  { slug: "curcuma-polvo", quantity: LIBRA, unit: "g", price: 10.0 },
  { slug: "agua-rosas", quantity: 25, unit: "g", price: 1.92 },
  { slug: "extracto-romero", quantity: 30, unit: "g", price: 1.3 },
  {
    slug: "carbon-activado",
    quantity: 100,
    unit: "g",
    price: 3.0,
    estimado: true,
    notes: "ESTIMADO según precios de mercado. Reemplazar con la factura real.",
  },

  // ── Activos ──
  { slug: "colageno-hidrolizado", quantity: 30, unit: "g", price: 1.44 },
  { slug: "vitamina-e", quantity: 30, unit: "g", price: 2.97 },

  // ── Aroma y color ──
  //
  // Las siete fragancias entran como lotes del mismo material y no como
  // materiales distintos: es una sola cosa —fragancia— comprada muchas
  // veces a distinto precio, que es exactamente lo que un lote representa.
  // El costeo usa el promedio; ver la nota en `costeo.ts`.
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 0.69, notes: "Coco" },
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 0.86, notes: "Lluvia de seda" },
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 0.92, notes: "La banda" },
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 1.09, notes: "Avena" },
  { slug: "fragancia-cosmetica", quantity: 60, unit: "g", price: 2.7, notes: "Romero" },
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 4.5, notes: "Coco pasión" },
  { slug: "fragancia-cosmetica", quantity: 30, unit: "g", price: 5.91, notes: "Bellísima" },
  { slug: "fijador-aroma", quantity: 50, unit: "g", price: 1.51 },
  { slug: "colorante-cosmetico", quantity: 10, unit: "g", price: 1.24 },
];

/**
 * Envases y empaque.
 *
 * No estaban en el inventario porque no son ingredientes, pero se compran
 * igual que todo lo demás y su precio cambia igual. Puestos aquí, entran
 * solos en la lista de compras el día que se acaben.
 */
export const ENVASES: {
  slug: string;
  name: string;
  purpose: string;
  compra: Omit<Compra, "slug">;
}[] = [
  {
    slug: "papel-film",
    name: "Papel film",
    purpose: "Envuelve cada jabón. Evita que la glicerina chupe humedad y sude.",
    compra: { quantity: 30, unit: "m", price: 1.0 },
  },
  {
    slug: "caja-envio",
    name: "Caja de envío",
    purpose: "La caja de los packs y de los pedidos de tres jabones para arriba.",
    compra: { quantity: 1, unit: "unidad", price: 0.63, notes: "$0,55 + IVA" },
  },
  {
    slug: "papel-kraft",
    name: "Papel kraft",
    purpose: "Relleno de la caja. Media hoja por caja.",
    compra: { quantity: 1, unit: "m", price: 0.2 },
  },
  {
    slug: "toallita",
    name: "Toallita de tela",
    purpose: "Va de regalo en los packs. La cose la Profe Nelly.",
    compra: { quantity: 20, unit: "unidad", price: 9.0, notes: "$9 el metro, salen 20 toallitas. NO incluye el tiempo de coserlas." },
  },
  {
    slug: "frasco-agua-micelar",
    name: "Frasco para agua micelar",
    purpose: "El envase del agua micelar.",
    compra: { quantity: 1, unit: "unidad", price: 0.37 },
  },
  {
    slug: "frasco-rolon",
    name: "Frasco rolón 10 ml",
    purpose: "El envase del perfume en aceite.",
    compra: { quantity: 1, unit: "unidad", price: 0.5 },
  },
  {
    slug: "caja-aluminio",
    name: "Caja de aluminio",
    purpose: "El envase del perfume vaselinado.",
    compra: { quantity: 1, unit: "unidad", price: 0.45 },
  },
];

/**
 * Qué empaque lleva cada cosa.
 *
 * Del producto va lo que lo acompaña siempre, se venda suelto o en pack.
 * Del pack va lo que solo existe cuando se arma el pack.
 */
export const EMPAQUE_POR_PRODUCTO: {
  sku: string;
  material: string;
  quantity: number;
  unit: string;
  notes?: string;
}[] = [
  // Todos los jabones, envueltos en film. 25 cm por barra.
  ...[
    "LIL-JAB-ARR", "LIL-JAB-CAF", "LIL-JAB-CAR", "LIL-JAB-COC", "LIL-JAB-CUR",
    "LIL-JAB-LAV", "LIL-JAB-MMA", "LIL-JAB-MAR", "LIL-JAB-NAR", "LIL-JAB-PEP",
    "LIL-JAB-ALU", "LIL-JAB-ROM", "LIL-JAB-ROS", "LIL-JAB-SAB",
  ].map((sku) => ({ sku, material: "papel-film", quantity: 0.25, unit: "m" })),

  { sku: "LIL-EXT-AMI", material: "frasco-agua-micelar", quantity: 1, unit: "unidad" },
  { sku: "LIL-EXT-PVA", material: "caja-aluminio", quantity: 1, unit: "unidad" },
  { sku: "LIL-EXT-PAC", material: "frasco-rolon", quantity: 1, unit: "unidad" },
];

/** Lo que lleva un pack por encima de lo que ya traen sus productos. */
export const EMPAQUE_POR_PACK: { material: string; quantity: number; unit: string }[] = [
  { material: "caja-envio", quantity: 1, unit: "unidad" },
  { material: "papel-kraft", quantity: 0.5, unit: "m" },
  { material: "toallita", quantity: 1, unit: "unidad" },
];

/**
 * Cuántas unidades vendibles rinde una tanda de cada receta.
 *
 * Observado, no calculado: de 500 g de base salen 5 jabones de ~100 g, y
 * las recetas están escritas para 250 g. La merma —lo que queda en la
 * jarra y en el molde— ya está adentro de ese número.
 */
export const RINDES: Record<string, number> = {
  "jabon-arroz": 2.5,
  "jabon-cafe": 2.5,
  "jabon-carbon": 2.5,
  "jabon-curcuma": 2.5,
  "jabon-manzanilla-miel": 2.5,
  "jabon-naranja": 2.5,
  "jabon-pepino": 2.5,
  "jabon-alumbre": 2.5,
  "jabon-romero": 2.5,
  "jabon-rosas": 2.5,
  "jabon-sabila": 2.5,
  "jabon-lavanda-marmoleado": 2.5,
  "jabon-arcilla-cafeina": 2.5,
  "jabon-avena-miel": 2.5,
  "jabon-papaya": 2.5,
  "jabon-ninos": 2.5,
};
