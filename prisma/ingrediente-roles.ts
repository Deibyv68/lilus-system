/**
 * Qué función cumple cada ingrediente dentro de una receta.
 *
 * Se aplica por nombre al sembrar, en vez de etiquetar los 478
 * ingredientes uno por uno: la mayoría se repite entre recetas, así que
 * una tabla por nombre cubre casi todo con una fracción del trabajo.
 *
 * La función NO es lo mismo que la categoría de la materia prima. La
 * glicerina es "auxiliar" en el inventario, pero en una crema cumple de
 * humectante y en un bloqueador de solvente. Aquí manda lo que hace en
 * la fórmula.
 *
 * Las claves que se usan aquí son las de `ROLE_LABELS` en
 * `src/lib/roles.ts`, que es donde se decide cómo se ve cada una.
 */

/**
 * Nombre exacto del ingrediente -> función.
 * La comparación ignora mayúsculas y acentos.
 */
export const INGREDIENT_ROLES: Record<string, string> = {
  // ── Bases ──
  "base de glicerina transparente": "base",
  "base de glicerina blanca": "base",
  "base de glicerina": "base",
  "base de glicerina transparente o blanca": "base",
  "crema base": "base",
  "base de champú": "base",
  "gel base": "base",
  "talco cosmético": "base",
  "almidón de maíz": "absorbente",
  "escamas de jabón": "base",
  "vaselina sólida simple": "base",

  // ── Agua y solventes ──
  "agua destilada": "solvente",
  "agua destilada caliente": "solvente",
  "agua destilada extra": "solvente",
  "agua tratada": "solvente",
  "alcohol al 96 %": "solvente",
  "alcohol al 70 %": "solvente",
  "alcohol cosmético": "solvente",
  "alcohol compuesto": "solvente",
  propilenglicol: "humectante",
  "agua de rosas": "humectante",

  // ── Tensioactivos ──
  "betaína de coco": "tensioactivo",
  "betaína de coco extra": "tensioactivo",
  "texapón 28 %": "tensioactivo",
  "coco glucósido": "tensioactivo",
  "peg-6 caprylic/capric glycerides": "tensioactivo",
  "poloxámero 188": "tensioactivo",
  "peg-40 aceite de ricino hidrogenado": "solubilizante",
  "polisorbato 20": "solubilizante",
  "tween 20 (polisorbato 20)": "solubilizante",
  polisorbato: "solubilizante",

  // ── Emulsionantes y espesantes ──
  dehyquart: "emulsionante",
  "alcohol cetílico": "espesante",
  "goma xantana": "espesante",
  "cellosize (hidroxietilcelulosa)": "espesante",
  "behentrimonium methosulfate": "acondicionador",
  "polyquaternium-7": "acondicionador",
  "polyquaternium-10": "acondicionador",
  "sin acondicionante": "acondicionador",

  // ── Conservación ──
  conservante: "conservante",
  "conservante cosmético": "conservante",
  "benzoato de sodio": "conservante",
  "caprilil glicol": "conservante",
  "edta disódico": "quelante",
  "vitamina e": "antioxidante",
  antioxidante: "antioxidante",

  // ── pH ──
  "ácido láctico": "ph",
  "ácido cítrico": "ph",

  // ── Humectantes ──
  glicerina: "humectante",
  "glicerina usp": "humectante",
  "glicerina usp líquida": "humectante",
  "glicerina vegetal": "humectante",
  "glicerina vegetal líquida": "humectante",
  "urea cosmética": "humectante",
  pantenol: "humectante",
  "ácido hialurónico": "humectante",
  "miel de abejas": "humectante",

  // ── Emolientes y oclusivos ──
  escualano: "emoliente",
  "aceite de jojoba": "emoliente",
  "aceite de almendra": "emoliente",
  "aceite de rosa mosqueta": "emoliente",
  "aceite de linaza": "emoliente",
  "aceite de avena": "emoliente",
  "aceite de argán": "emoliente",
  "aceite de macadamia": "emoliente",
  "aceite de aguacate": "emoliente",
  "aceite de coco": "emoliente",
  "aceite de caléndula": "emoliente",
  "triglicéridos caprílico/cáprico": "emoliente",
  "aceite de vaselina": "oclusivo",
  "manteca de karité": "oclusivo",
  "manteca de cacao": "oclusivo",
  "aceite de silicón (dimeticona)": "oclusivo",
  "aceite de silicón": "oclusivo",
  ciclometicona: "emoliente",

  // ── Activos ──
  niacinamida: "activo",
  "alfa-arbutina": "activo",
  "ácido tranexámico": "activo",
  alantoína: "activo",
  "alantoína (baba de caracol)": "activo",
  "centella asiática": "activo",
  ceramidas: "activo",
  "tintura de benjuí": "activo",
  q10: "activo",
  cafeína: "activo",
  biotina: "activo",
  queratina: "activo",
  "hidrolizado de proteínas": "activo",
  "hidrolizado de proteína de trigo": "activo",
  "hidrolizado de seda": "activo",
  "sin proteína": "activo",
  "papaína en polvo": "activo",
  "aloe vera en polvo 200:1": "activo",
  "aceite de sábila": "activo",
  "citrato de trietilo": "activo",
  "hidróxido de magnesio": "activo",
  "bicarbonato de sodio": "activo",
  "polvo de piedra de alumbre": "activo",
  "undecilenato de zinc": "activo",
  "avena coloidal": "activo",
  "extracto de té verde": "activo",
  "extracto de manzanilla": "activo",
  "extracto de pepino": "activo",
  "extracto de papaya": "activo",
  "extracto de romero": "activo",
  "extracto de cebolla": "activo",
  "extracto de cebolla desodorizado": "activo",
  "extracto de cola de caballo": "activo",
  "aroma johnson's baby": "aroma",

  // ── Aceites esenciales ──
  "aceite esencial de árbol de té": "activo",
  "aceite esencial de lavanda": "activo",
  "aceite esencial de romero": "activo",
  "aceite esencial de naranja dulce": "aroma",
  "aceite esencial de geranio": "aroma",
  "aceite esencial de palmarosa": "aroma",
  "aceite esencial de menta": "activo",
  "aceite mentolado": "activo",
  "aceite de manzanilla": "activo",
  "aceite de cúrcuma": "aroma",
  "aceite de zanahoria": "activo",
  "aceite de cola de caballo": "activo",
  "aceite macerado en romero": "activo",
  "mentol cristalizado": "activo",
  "sin romero": "activo",
  "sin agente refrescante": "activo",
  "solo aceite esencial de árbol de té": "activo",

  // ── Arcillas, minerales y absorbentes ──
  "arcilla blanca (caolín)": "absorbente",
  caolín: "absorbente",
  "arcilla bentonita": "absorbente",
  "arcilla rhassoul": "absorbente",
  "arcilla verde": "absorbente",
  "arcilla rosa": "absorbente",
  "carbón activado en polvo": "absorbente",
  "óxido de zinc": "activo",
  "dióxido de titanio": "colorante",
  "sin arcilla": "absorbente",

  // ── Exfoliantes y polvos vegetales ──
  "café granulado": "exfoliante",
  "avena molida": "exfoliante",
  "avena molida fina": "exfoliante",
  "hojuelas de avena": "exfoliante",
  "polvo de arroz": "exfoliante",
  "polvo de rosas": "exfoliante",
  "polvo de pepino": "exfoliante",
  "polvo de naranja": "exfoliante",
  "polvo de romero": "exfoliante",
  "polvo de cúrcuma": "colorante",
  "gránulos exfoliantes": "exfoliante",
  "gránulos exfoliantes de frutilla": "exfoliante",
  "pepas de papaya trituradas": "exfoliante",
  "canela en polvo": "activo",
  maicena: "espesante",
  "leche de coco en polvo": "emoliente",
  "leche de cabra en polvo": "emoliente",
  "sin leche en polvo": "emoliente",
  "flores de manzanilla disecadas": "colorante",
  "pétalos de caléndula": "colorante",

  // ── Color y aroma ──
  "polvo de nácar": "colorante",
  "ultramarino violeta": "colorante",
  "colorante violeta": "colorante",
  "colorante rosado": "colorante",
  "colorante verde": "colorante",
  "colorante amarillo": "colorante",
  "colorante naranja": "colorante",
  "colorante hidrosoluble": "colorante",
  colorante: "colorante",
  "cúrcuma en pizca": "colorante",
  "escarcha cosmética": "colorante",
  mica: "colorante",
  aroma: "aroma",
  "aroma fresh": "aroma",
  "aroma de café": "aroma",
  "aroma de rosas": "aroma",
  "aroma de naranja": "aroma",
  "aroma de sábila": "aroma",
  "aroma a lavanda": "aroma",
  "aroma de miel o de avena": "aroma",
  "aroma adicional": "aroma",
  "aroma suave": "aroma",
  "sin aroma": "aroma",
  fragancia: "aroma",
  "fragancia para perfume": "aroma",
  "fijador de aroma": "fijador",
  "fijador de perfume": "fijador",
  "sellador de perfume": "fijador",

  // ── Jabonería ──
  "bloqueador de humedad": "activo",

  // ── Materia prima en crudo, de la que sale otra receta ──
  naranja: "base",
  "coco grande semiduro": "base",
  frutillas: "base",
  "cáscara de pepino": "base",
  "cáscaras de cítrico secas": "base",
  "rosas sin fumigar": "base",
  "sal en grano": "exfoliante",
  "cúrcuma en polvo": "colorante",
  "polvo de alumbre": "activo",
  "glicerado de naranja": "humectante",
  "fenoxietanol + etilhexilglicerina": "conservante",
  // Opción «ninguno» dentro de un grupo de refuerzos activos
  "sin refuerzo": "activo",
};

/** Normaliza para comparar sin importar mayúsculas ni acentos. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9%/:.\s()-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Las claves de arriba están escritas con acentos, como se leen. Se
 * normalizan una sola vez para poder buscar sin ellos.
 */
const LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(INGREDIENT_ROLES).map(([k, v]) => [normalizeName(k), v])
);

export function roleFor(name: string): string | null {
  return LOOKUP[normalizeName(name)] ?? null;
}
