/**
 * Datos del recetario LILUS.
 *
 * Jabones, cremas y agua micelar están reformulados según el análisis de
 * docs/analisis-recetas.md. Los perfumes quedan como los dictó la dueña.
 * Las recetas originales, tal cual se dictaron, viven en docs/recetario.md.
 *
 * Dos mecanismos que conviene entender antes de editar:
 *
 * - `variant`: fórmulas o métodos alternativos de la MISMA receta. Se
 *   muestran como pestañas y solo se ve una a la vez.
 *
 * - `optionGroup`: alternativas para UN ingrediente. Se muestran como
 *   desplegable. Cada opción trae su propia cantidad y notas. Siempre hay
 *   al menos una opción con algo que ya se tiene en el taller, para que la
 *   receta sirva aunque no se haya comprado nada nuevo.
 */

export type RecipeCategory = "base" | "jabon" | "crema" | "perfume" | "otro";

export type RecipeSeed = {
  slug: string;
  name: string;
  category: RecipeCategory;
  summary?: string;
  yield?: string;
  restTime?: string;
  container?: string;
  usage?: string;
  notes?: string[];
  productSku?: string;
  phValue?: string;
  phKind?: "objetivo" | "esperado";
  ingredients: {
    name: string;
    quantity?: string;
    note?: string;
    optional?: boolean;
    variant?: string;
    linkedSlug?: string;
    optionGroup?: string;
    optionLabel?: string;
    isRecommended?: boolean;
    percentage?: number;
  }[];
  steps: { text: string; variant?: string }[];
  benefits?: { ingredient?: string; text: string }[];
};

// ── Bloques que se repiten ──────────────────────────────────────────────

const BLOQUEADOR = {
  name: "Bloqueador de humedad",
  quantity: "10 gotas",
  linkedSlug: "bloqueador-humedad",
};

/** Betaína: mejora espuma y baja la irritación. Va en todos los jabones. */
const BETAINA = {
  name: "Betaína de coco",
  quantity: "5 g",
  note: "Suaviza el jabón y da espuma más cremosa",
};

/**
 * Conservante para producto con agua. El fenoxietanol es el recomendado;
 * el Kemidant queda como alternativa porque ya está en el taller.
 */
function conservante(gramos: string, pct: number) {
  return [
    {
      name: "Conservante",
      optionGroup: "conservante",
      optionLabel: "Fenoxietanol + etilhexilglicerina",
      isRecommended: true,
      quantity: gramos,
      percentage: pct,
      note: "Amplio espectro, sin liberadores de formaldehído. Verifica el porcentaje en la ficha del proveedor",
    },
    {
      name: "Conservante",
      optionGroup: "conservante",
      optionLabel: "Kemidant L (DMDM hydantoin)",
      quantity: gramos,
      percentage: pct,
      note: "Ya disponible en el taller. Libera formaldehído: aceptable aquí, pero no es la primera opción en producto facial",
    },
  ];
}

/** Fase grasa: lo que le faltaba a las cremas. */
function faseGrasa(gramos: string) {
  return [
    {
      name: "Escualano",
      optionGroup: "fase-grasa",
      optionLabel: "Escualano",
      isRecommended: true,
      quantity: gramos,
      note: "Ligero, seco al tacto, no se enrancia. El mejor acabado",
    },
    {
      name: "Aceite de jojoba",
      optionGroup: "fase-grasa",
      optionLabel: "Jojoba",
      quantity: gramos,
      note: "Es una cera, no un aceite: tampoco se enrancia. Muy parecido al sebo",
    },
    {
      name: "Aceite de almendra",
      optionGroup: "fase-grasa",
      optionLabel: "Almendra (ya disponible)",
      quantity: gramos,
      note: "Ya está en el taller. Se enrancia más rápido: usa vitamina E y no guardes la crema más de 6 meses",
    },
  ];
}

const QUELANTE = {
  name: "EDTA disódico",
  quantity: "0.2 % del total",
  percentage: 0.2,
  note: "Potencia el conservante y evita que los metales oxiden la fórmula",
};

export const RECIPES: RecipeSeed[] = [
  // ═══════════════════ PREPARACIONES BASE ═══════════════════
  {
    slug: "bloqueador-humedad",
    name: "Bloqueador de humedad",
    category: "base",
    summary: "Aditivo para los jabones de glicerina.",
    yield: "Un frasco de 60 ml",
    notes: [
      "Prepara solo lo que vayas a gastar en pocas semanas: el alcohol se evapora cada vez que destapas el frasco y, cuando baja, la mezcla deja de conservarse sola.",
      "Lo que más evita que el jabón sude no es este aditivo: es envolverlo en film apenas desmoldas y trabajar en días secos.",
    ],
    ingredients: [
      { name: "Agua destilada", quantity: "15 g" },
      { name: "Glicerina USP líquida", quantity: "15 g" },
      { name: "Alcohol al 96 %", quantity: "15 g", note: "También se lo conoce como etanol 96" },
    ],
    steps: [
      { text: "Mezclar todo bien en un recipiente." },
      { text: "Guardar en un frasco de 60 ml, etiquetado con la fecha." },
      { text: "Agregar a los jabones según la cantidad de cada fórmula." },
    ],
  },

  {
    slug: "crema-base",
    name: "Crema base",
    category: "crema",
    summary: "Base de las demás cremas, y también producto de uso directo.",
    phValue: "5.0 – 5.5",
    phKind: "objetivo",
    usage:
      "Aplicar en cualquier tipo de piel, incluso grasosa. Masajear por 5 minutos y luego lavar. Se aplica pasando un día.",
    notes: [
      "Tres fórmulas. La LILUS es la recomendada: incorpora fase grasa, quelante y antioxidante, y corrige la temperatura de entrada del Dehyquart.",
      "El Dehyquart es un éster y se hidroliza por encima de 80 °C. Agregarlo a agua hirviendo rompe parte del emulsionante justo al incorporarlo: por eso entra a 70–75 °C.",
      "El Dehyquart también se vende escrito como «Deicuar».",
      "Es un emulsionante catiónico: no mezclar con ingredientes aniónicos o la emulsión se corta.",
      "Medir el pH diluyendo 1 parte de crema en 9 de agua destilada. La tira no lee bien sobre crema pura.",
    ],
    ingredients: [
      // ── Fórmula LILUS ──
      { name: "Agua destilada", quantity: "700 g", variant: "LILUS" },
      { name: "Alcohol cetílico", quantity: "70 g", variant: "LILUS", note: "Espesante" },
      { name: "Dehyquart", quantity: "40 g", variant: "LILUS", note: "Emulsionante. Entra a 70–75 °C" },
      { name: "Glicerina", quantity: "20 g", variant: "LILUS", note: "Humectante" },
      ...faseGrasa("80 g").map((o) => ({ ...o, variant: "LILUS" })),
      {
        name: "Manteca de karité",
        quantity: "30 g",
        variant: "LILUS",
        note: "Oclusivo: sella para que el agua no se escape",
      },
      { ...QUELANTE, quantity: "2 g", variant: "LILUS" },
      {
        name: "Vitamina E",
        quantity: "3 g",
        percentage: 0.3,
        variant: "LILUS",
        note: "Antioxidante. Protege la fase grasa",
      },
      ...conservante("5 g", 0.5).map((o) => ({ ...o, variant: "LILUS" })),
      {
        name: "Ácido láctico",
        quantity: "Cantidad necesaria",
        variant: "LILUS",
        note: "Solo para ajustar el pH a 5.0–5.5",
      },

      // ── Profe Nelly ──
      { name: "Agua destilada", quantity: "1 taza", variant: "Profe Nelly" },
      { name: "Alcohol cetílico", quantity: "25 g", variant: "Profe Nelly" },
      { name: "Dehyquart", quantity: "25 g", variant: "Profe Nelly" },
      { name: "Conservante", quantity: "1/4 cucharadita", variant: "Profe Nelly" },

      // ── Ingeniero ──
      { name: "Alcohol cetílico", quantity: "80 g", variant: "Ingeniero" },
      { name: "Dehyquart", quantity: "40 g", variant: "Ingeniero" },
      { name: "Glicerina", quantity: "15 g", variant: "Ingeniero" },
      { name: "Agua destilada caliente", quantity: "850 g", variant: "Ingeniero" },
    ],
    steps: [
      // ── LILUS ──
      { text: "Pesar todos los ingredientes antes de empezar y ordenarlos según van entrando.", variant: "LILUS" },
      { text: "Calentar el agua destilada a 75 °C. Disolver ahí el EDTA y la glicerina.", variant: "LILUS" },
      { text: "Aparte, derretir a baño maría el alcohol cetílico, la manteca de karité y la fase grasa, hasta 75 °C.", variant: "LILUS" },
      { text: "Retirar del fuego y dejar que la fase grasa baje a 70–75 °C. Agregar el Dehyquart y mover hasta disolver.", variant: "LILUS" },
      { text: "Verter el agua sobre la fase grasa, las dos alrededor de 70 °C.", variant: "LILUS" },
      { text: "Batir con batidora de inmersión 2 a 3 minutos, en tandas cortas para no meter aire.", variant: "LILUS" },
      { text: "Seguir moviendo con espátula mientras enfría, hasta que tome cuerpo.", variant: "LILUS" },
      { text: "Por debajo de 40 °C, agregar la vitamina E y el conservante. Mezclar bien.", variant: "LILUS" },
      { text: "Medir el pH diluido y ajustar a 5.0–5.5 con ácido láctico si hace falta.", variant: "LILUS" },
      { text: "Envasar, etiquetar con lote y fecha, y guardar una muestra de retención.", variant: "LILUS" },

      // ── Profe Nelly ──
      { text: "Poner a hervir la taza de agua destilada.", variant: "Profe Nelly" },
      { text: "Agregar el alcohol cetílico y dejar que se disuelva bien.", variant: "Profe Nelly" },
      { text: "Agregar el Dehyquart.", variant: "Profe Nelly" },
      { text: "Batir con espátula hasta que la crema se enfríe y tome espesor.", variant: "Profe Nelly" },
      { text: "Ya totalmente fría, agregar el conservante. Rinde 500 g.", variant: "Profe Nelly" },

      // ── Ingeniero ──
      { text: "Derretir el alcohol cetílico a baño maría hasta que esté completamente líquido.", variant: "Ingeniero" },
      { text: "Agregar la glicerina y dejar que se derrita.", variant: "Ingeniero" },
      { text: "Agregar el Dehyquart y dejar que se derrita por completo.", variant: "Ingeniero" },
      { text: "Con el agua destilada ya caliente, agregarla a la mezcla.", variant: "Ingeniero" },
      { text: "Batir con espátula hasta que tome consistencia de crema.", variant: "Ingeniero" },
      { text: "Dejar enfriar totalmente y agregar el conservante.", variant: "Ingeniero" },
    ],
    benefits: [
      { text: "Limpia y suaviza la piel." },
      { text: "Deja una película que reduce la sensación de tirantez." },
    ],
  },

  {
    slug: "aceite-coco",
    name: "Aceite de coco",
    category: "base",
    summary: "Aporta brillo, suavidad y humectación.",
    container: "Frasco de vidrio ámbar, en refrigeración",
    notes: [
      "El coco debe estar a término medio (semiduro).",
      "Cernir dos veces.",
      "Lleva aceite de vaselina, que es de origen mineral: el producto final es una mezcla, no aceite de coco puro. Tenerlo en cuenta al declarar ingredientes.",
      "Etiquetar con la fecha. No usar más allá de 3 meses.",
    ],
    ingredients: [
      { name: "Coco grande semiduro", quantity: "1" },
      { name: "Aceite de vaselina", quantity: "60 g", note: "Se puede subir hasta 120 g" },
      {
        name: "Vitamina E",
        quantity: "0.5 g",
        note: "Antioxidante: es lo que evita que se enrancie",
      },
    ],
    steps: [
      { text: "Pelar el coco y cortar la corteza oscura." },
      { text: "Cortar en trocitos y licuar con 2 tazas de agua hirviendo." },
      { text: "Cernir en una tela limpia." },
      { text: "Colocar en un recipiente, tapar y refrigerar 3 horas." },
      { text: "Retirar la grasa que se separó del agua." },
      { text: "Pasar a un recipiente resistente al calor y cocinar a fuego bajo hasta que se separe el aceite." },
      { text: "Subir un par de minutos por encima de 100 °C para evaporar el agua residual: es lo que evita que se pudra." },
      { text: "Agregar el aceite de vaselina y cocinar unos minutos más." },
      { text: "Cernir dos veces y dejar enfriar." },
      { text: "Ya frío, agregar la vitamina E y envasar en frasco ámbar." },
    ],
    benefits: [{ text: "Aporta brillo, suavidad y humectación." }],
  },

  {
    slug: "glicerado-citricos",
    name: "Glicerado de cítricos",
    category: "base",
    summary: "Sirve para naranja, limón, mandarina o toronja.",
    container: "Frasco de vidrio color ámbar",
    usage:
      "En el rostro, solo de noche. Aplicar con un algodón, dejar actuar y lavar. No usar antes de exponerse al sol.",
    notes: [
      "Las cáscaras de cítricos contienen furocumarinas, que son fotosensibilizantes: en la piel y con sol pueden producir manchas y quemaduras. Por eso el uso facial es solo nocturno.",
      "En el jabón no hay problema, porque se enjuaga.",
      "Se pueden hacer jabones decorados con una rodaja disecada: llenar el molde hasta la mitad, colocar la rodaja, dejar cuajar un momento y agregar el resto.",
    ],
    ingredients: [
      { name: "Cáscaras de cítrico secas", quantity: "Cantidad necesaria" },
      { name: "Glicerina", quantity: "30 g" },
      { name: "Agua destilada", quantity: "30 g" },
      ...conservante("0.3 g", 0.5),
    ],
    steps: [
      { text: "Poner en una olla las cáscaras, la glicerina y el agua destilada.", variant: "A fuego directo" },
      { text: "Hervir bien 3 minutos y luego bajar el fuego.", variant: "A fuego directo" },
      { text: "Dejar enfriar y cernir.", variant: "A fuego directo" },
      { text: "Ya frío, agregar el conservante.", variant: "A fuego directo" },

      { text: "Poner las cáscaras, la glicerina y el agua destilada en un frasquito y taparlo.", variant: "A baño maría" },
      { text: "Poner un trapo en el fondo de la olla y acomodar el frasco encima, para que no se mueva con el hervor.", variant: "A baño maría" },
      { text: "Tapar la olla y mantener 20 minutos.", variant: "A baño maría" },
      { text: "Dejar enfriar tapada.", variant: "A baño maría" },
      { text: "Ya frío, cernir y agregar el conservante.", variant: "A baño maría" },
    ],
    benefits: [
      { text: "Humecta la piel y aporta antioxidantes." },
      { text: "Ayuda a mantener los poros despejados." },
    ],
  },

  {
    slug: "polvo-naranja",
    name: "Polvo de naranja",
    category: "base",
    summary: "Igual para limón, mandarina o toronja.",
    container: "Frasco hermético con bolsita de sílica gel",
    notes: [
      "Secar bajo sombra, nunca al sol directo: al sol pierde sus propiedades. Se puede secar tras una ventana.",
      "Tiene que quedar quebradizo. Si se dobla en vez de quebrarse, todavía tiene agua y va a enmohecer dentro del jabón.",
      "Etiquetar con la fecha. Máximo 6 meses.",
      "Usar un molino dedicado, no el de la cocina.",
    ],
    ingredients: [{ name: "Naranja", quantity: "1" }],
    steps: [
      { text: "Lavar la naranja y secarla." },
      { text: "Rallar la cáscara, tomando en lo posible solo la parte de color." },
      { text: "Secar bajo sombra hasta que quede quebradizo." },
      { text: "Triturar en molino y guardar en frasco hermético etiquetado." },
    ],
  },

  {
    slug: "polvo-rosas",
    name: "Polvo de rosas",
    category: "base",
    summary: "Tres métodos de secado.",
    container: "Frasco hermético con bolsita de sílica gel",
    notes: [
      "IMPORTANTE: usar solo rosas de cultivo orgánico o que se sepa que no fueron fumigadas. Las rosas de floristería se tratan con fungicidas e insecticidas pensando en flor de adorno, y al secar y triturar el pétalo esos residuos se concentran. El lavado no elimina lo que la planta absorbió.",
      "Si no se consiguen rosas seguras, comprar polvo de rosas de grado cosmético. Es de las pocas preparaciones donde vale más comprarla que hacerla.",
      "De los tres métodos, el de la plancha es el preferible: el de sal deja sal en el polvo, y la sal atrae humedad al jabón.",
      "Con cualquier método, triturar en molino eléctrico una vez secos.",
    ],
    ingredients: [
      { name: "Rosas sin fumigar", quantity: "Cantidad necesaria" },
      { name: "Sal en grano", quantity: "Cantidad necesaria", optional: true, note: "Solo para el método con sal" },
    ],
    steps: [
      { text: "Sacar los pétalos y lavarlos.", variant: "Al aire" },
      { text: "Ponerlos a secar en un lugar con mucha claridad.", variant: "Al aire" },

      { text: "Extender papel aluminio, encima los pétalos y encima un paño.", variant: "Con plancha" },
      { text: "Pasar la plancha hasta que queden quebradizos.", variant: "Con plancha" },

      { text: "Colocar las rosas boca abajo en un recipiente.", variant: "Con sal en grano" },
      { text: "Cubrir toda la rosa con sal en grano.", variant: "Con sal en grano" },
      { text: "Tapar y dejar una semana.", variant: "Con sal en grano" },
    ],
  },

  {
    slug: "polvo-pepino",
    name: "Polvo de pepino",
    category: "base",
    summary: "Se hace con la cáscara del pepino.",
    container: "Frasco hermético con bolsita de sílica gel",
    notes: [
      "Es el polvo con mayor riesgo de moho, porque la cáscara de pepino es la que más agua tiene. No escatimar en el secado.",
      "Tiene que quedar quebradizo, no correoso.",
      "Etiquetar con la fecha. Máximo 6 meses.",
    ],
    ingredients: [{ name: "Cáscara de pepino", quantity: "Cantidad necesaria" }],
    steps: [
      { text: "Pelar el pepino y reservar la cáscara." },
      { text: "Secar al sol o con la plancha hasta que quede muy seca y quebradiza." },
      { text: "Triturar en molino hasta que quede polvo." },
      { text: "Guardar en frasco hermético etiquetado con la fecha." },
    ],
  },

  {
    slug: "granulos-frutilla",
    name: "Gránulos exfoliantes de frutilla",
    category: "base",
    summary: "Se aprovechan las pepitas del jugo de frutilla.",
    container: "Frasco hermético",
    notes: [
      "El rociado con alcohol antes de secar es lo que evita el moho. No saltarlo.",
      "Asegurarse de que estén completamente secas antes de guardar.",
    ],
    ingredients: [
      { name: "Frutillas", quantity: "Cantidad necesaria" },
      { name: "Alcohol al 70 %", quantity: "Para rociar" },
    ],
    steps: [
      { text: "Hacer un jugo de frutilla. Quedan las pepitas." },
      { text: "Lavar bien las pepitas." },
      { text: "Extenderlas sobre una toalla de papel." },
      { text: "Rociar alcohol." },
      { text: "Secar por completo y guardar en frasco hermético." },
    ],
  },

  // ═══════════════════ JABONES ═══════════════════
  //
  // Se quitaron colágeno, elastina, ácido hialurónico, salicílico y
  // glicólico: en un producto que se enjuaga en 30 segundos y a pH 9–10 no
  // pueden actuar. En su lugar entran arcillas, aceites esenciales reales y
  // sobreengrase, que sí trabajan por contacto o quedan depositados.
  //
  // Cuatro colorantes sintéticos salen reemplazados por arcillas, que dan
  // el color y además cumplen función.

  {
    slug: "jabon-cafe",
    name: "Jabón de café",
    category: "jabon",
    productSku: "LIL-JAB-CAF",
    summary: "Exfoliante y desodorizante, con canela.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    usage: "Para cuerpo. En rostro, solo si el café está molido muy fino.",
    notes: [
      "Derretir la base a 60–65 °C. Por encima de 70 la base se degrada y suda más.",
      "El aroma entra a 55–58 °C: más caliente y se evapora.",
      "El caolín le da deslizamiento al café, que solo raspa fuerte por las aristas del grano.",
      "La canela es un sensibilizante conocido. No recomendarlo para piel sensible ni para niños.",
      "Rociar el molde con alcohol antes de verter, y la superficie apenas vertido, para quitar burbujas.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Arcilla blanca (caolín)",
        optionGroup: "arcilla-cafe",
        optionLabel: "Caolín",
        isRecommended: true,
        quantity: "3 g",
        note: "Suaviza la exfoliación y da deslizamiento",
      },
      {
        name: "Sin arcilla",
        optionGroup: "arcilla-cafe",
        optionLabel: "Omitir",
        quantity: "—",
        note: "El café exfolia más fuerte. No usar en rostro",
      },
      {
        name: "Manteca de karité",
        quantity: "5 g",
        note: "Sobreengrase: compensa lo abrasivo del café",
      },
      { name: "Café granulado", quantity: "4 g", note: "Molido fino si es para rostro" },
      { name: "Canela en polvo", quantity: "0.5 g" },
      { name: "Aceite de almendra", quantity: "2 g" },
      { name: "Aroma de café", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar y ordenarlo según va entrando." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar la manteca de karité y el aceite de almendra, y mezclar." },
      { text: "Agregar la betaína, el bloqueador de humedad y el caolín. Mezclar bien." },
      { text: "Agregar el café y la canela, y mezclar." },
      { text: "A 55–58 °C, agregar el aroma y el fijador. Mezclar suave para no meter aire." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie con alcohol para reventar las burbujas." },
      { text: "Dejar solidificar, cubrir con film y reposar 24 horas antes de usar." },
    ],
    benefits: [
      { ingredient: "Café", text: "Exfolia y absorbe olores." },
      { ingredient: "Caolín", text: "Suaviza la exfoliación y da deslizamiento." },
      { ingredient: "Karité", text: "Deja película: el jabón no reseca." },
      { ingredient: "Betaína", text: "Baja la irritación del lavado y mejora la espuma." },
    ],
  },

  {
    slug: "jabon-carbon",
    name: "Jabón de carbón activado",
    category: "jabon",
    productSku: "LIL-JAB-CAR",
    summary: "Para piel grasa. Absorbe sebo y purifica poros.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    usage: "Rostro y cuerpo. Se puede usar desde los 12 años.",
    notes: [
      "Se quitaron el ácido salicílico y el glicólico: necesitan pH 3–4 y el jabón está a 9–10, así que estaban inactivos. La bentonita y el árbol de té hacen por contacto lo que se esperaba de ellos.",
      "Usar mascarilla al pesar el carbón activado: es un polvo muy fino que se respira.",
      "Derretir a 60–65 °C, aroma a 55–58 °C, verter a 55–60 °C.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      { name: "Carbón activado en polvo", quantity: "1.5 g", note: "Absorbe grasa por contacto" },
      {
        name: "Arcilla bentonita",
        optionGroup: "arcilla-carbon",
        optionLabel: "Bentonita",
        isRecommended: true,
        quantity: "5 g",
        note: "Absorbe sebo. Es lo que se esperaba del ácido salicílico",
      },
      {
        name: "Arcilla rhassoul",
        optionGroup: "arcilla-carbon",
        optionLabel: "Rhassoul",
        quantity: "5 g",
        note: "Más suave que la bentonita, buena para piel sensible",
      },
      {
        name: "Arcilla verde",
        optionGroup: "arcilla-carbon",
        optionLabel: "Verde",
        quantity: "5 g",
        note: "Alternativa si no hay bentonita ni rhassoul",
      },
      {
        name: "Aceite esencial de árbol de té",
        quantity: "2.5 g",
        percentage: 1,
        note: "Al 1 %: aquí sí tiene acción antimicrobiana. Aceite esencial, no fragancia",
      },
      { name: "Aceite de caléndula", quantity: "2 g", note: "Calma la piel irritada" },
      { name: "Agua de rosas", quantity: "5 g" },
      { name: "Aroma", quantity: "15 gotas", optional: true },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Mascarilla puesta para el carbón y la arcilla." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar el carbón activado y la arcilla, y mezclar hasta que no queden grumos." },
      { text: "Agregar la betaína, el bloqueador, el agua de rosas y el aceite de caléndula." },
      { text: "A 55–58 °C, agregar el aceite esencial de árbol de té y el aroma." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie con alcohol." },
      { text: "Dejar solidificar, cubrir con film y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Carbón activado", text: "Absorbe grasa y residuos por contacto." },
      { ingredient: "Bentonita", text: "Absorbe sebo. Deja la piel mate." },
      { ingredient: "Árbol de té", text: "Antimicrobiano, al 1 % sí actúa." },
      { ingredient: "Caléndula", text: "Calma la piel irritada." },
    ],
  },

  {
    slug: "jabon-arroz",
    name: "Jabón de arroz",
    category: "jabon",
    productSku: "LIL-JAB-ARR",
    summary: "Suaviza y aporta luminosidad. Espuma cremosa.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    usage: "Cuerpo y rostro.",
    notes: [
      "Se cambió «blanqueador» por «aporta luminosidad»: en un producto que se enjuaga no hay acción despigmentante real. El efecto es de suavidad y tono uniforme al tacto.",
      "La leche en polvo es lo que da la espuma cremosa y el ácido láctico que suaviza.",
      "Derretir a 60–65 °C, aroma a 55–58 °C.",
    ],
    ingredients: [
      { name: "Base de glicerina blanca", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      { name: "Polvo de arroz", quantity: "7 g" },
      {
        name: "Leche de coco en polvo",
        optionGroup: "leche",
        optionLabel: "Leche de coco",
        isRecommended: true,
        quantity: "8 g",
        note: "Espuma cremosa y ácido láctico natural",
      },
      {
        name: "Leche de cabra en polvo",
        optionGroup: "leche",
        optionLabel: "Leche de cabra",
        quantity: "8 g",
        note: "Más rica en grasa. Clásica en jabonería",
      },
      {
        name: "Sin leche en polvo",
        optionGroup: "leche",
        optionLabel: "Omitir",
        quantity: "—",
        note: "El jabón queda con espuma menos cremosa",
      },
      { name: "Maicena", quantity: "2 g", note: "Disuelta en 5 g de agua de rosas" },
      { name: "Aceite de rosa mosqueta", quantity: "2 g", note: "Sobreengrase" },
      { name: "Aroma", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Disolver la maicena en el agua de rosas." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar la leche en polvo poco a poco, mezclando para que no grumee." },
      { text: "Agregar la betaína, el bloqueador, la maicena disuelta y el aceite de rosa mosqueta." },
      { text: "Agregar el polvo de arroz y mezclar bien." },
      { text: "A 55–58 °C, agregar el aroma y el fijador." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar, cubrir con film y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Polvo de arroz", text: "Suaviza y da deslizamiento." },
      { ingredient: "Leche en polvo", text: "Espuma cremosa y sensación sedosa." },
      { ingredient: "Rosa mosqueta", text: "Sobreengrase: no reseca." },
      { text: "Deja la piel suave y de tono uniforme." },
    ],
  },

  {
    slug: "jabon-rosas",
    name: "Jabón de rosas",
    category: "jabon",
    productSku: "LIL-JAB-ROS",
    summary: "Suave y sedoso, con color natural de arcilla.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    usage: "Todo tipo de piel. Rostro y cuerpo.",
    notes: [
      "La arcilla rosa reemplaza al colorante sintético: da el color y además limpia suavemente. Permite decir «sin colorantes artificiales».",
      "El geranio y la palmarosa huelen a rosa y cuestan una fracción de lo que cuesta la rosa real.",
      "Si no se consiguen rosas sin fumigar, omitir el polvo de rosas y dejar solo la arcilla.",
      "Derretir a 60–65 °C, aroma a 55–58 °C.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Arcilla rosa",
        quantity: "5 g",
        note: "Da el color y aporta tacto sedoso. Reemplaza al colorante",
      },
      {
        name: "Polvo de rosas",
        quantity: "2 g",
        optional: true,
        linkedSlug: "polvo-rosas",
        note: "Solo de rosas sin fumigar o de grado cosmético",
      },
      {
        name: "Aceite esencial de geranio",
        optionGroup: "aroma-rosas",
        optionLabel: "Geranio (esencial)",
        isRecommended: true,
        quantity: "2 g",
        note: "Huele a rosa, mucho más económico que la rosa real",
      },
      {
        name: "Aceite esencial de palmarosa",
        optionGroup: "aroma-rosas",
        optionLabel: "Palmarosa (esencial)",
        quantity: "2 g",
        note: "Nota rosada más fresca",
      },
      {
        name: "Aroma de rosas",
        optionGroup: "aroma-rosas",
        optionLabel: "Fragancia de rosas",
        quantity: "20 gotas",
        note: "Ya disponible. Aroma sin propiedades del aceite esencial",
      },
      { name: "Aceite de rosa mosqueta", quantity: "2 g", note: "Sobreengrase" },
      { name: "Aceite de linaza", quantity: "1 g" },
      { name: "Fijador de aroma", quantity: "5 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar la arcilla rosa y mezclar hasta que no queden grumos." },
      { text: "Agregar la betaína, el bloqueador y los aceites." },
      { text: "Agregar el polvo de rosas si se usa, y mezclar." },
      { text: "A 55–58 °C, agregar el aroma y el fijador." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar, cubrir con film y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Arcilla rosa", text: "Limpia suavemente y deja tacto sedoso. Da el color sin colorante." },
      { ingredient: "Rosa mosqueta", text: "Sobreengrase: no reseca." },
      { text: "Apto para todo tipo de piel." },
    ],
  },

  {
    slug: "jabon-avena-miel",
    name: "Jabón de avena y miel de abejas",
    category: "jabon",
    summary: "Para piel sensible. Calma y suaviza.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    usage: "Piel sensible o irritada. Rostro y cuerpo.",
    notes: [
      "La avena coloidal es el cambio clave: la avena molida solo exfolia, la coloidal está reconocida como protector cutáneo y tiene efecto calmante que sobrevive al enjuague. Es de los pocos activos con respaldo que funcionan en un jabón.",
      "La miel es azúcar y atrae humedad del aire: este es el jabón que más va a sudar. Envolver en film inmediatamente después de desmoldar.",
      "Si se usa base transparente y se quiere textura visible, van hojuelas de avena en vez de coloidal.",
      "Derretir a 60–65 °C, aroma a 55–58 °C.",
    ],
    ingredients: [
      { name: "Base de glicerina blanca", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Avena coloidal",
        optionGroup: "avena",
        optionLabel: "Avena coloidal",
        isRecommended: true,
        quantity: "10 g",
        note: "Protector cutáneo reconocido. Calma y alivia el picor",
      },
      {
        name: "Avena molida fina",
        optionGroup: "avena",
        optionLabel: "Avena molida",
        quantity: "10 g",
        note: "Ya disponible. Exfolia, pero sin el efecto calmante de la coloidal",
      },
      {
        name: "Hojuelas de avena",
        optionGroup: "avena",
        optionLabel: "Hojuelas (base transparente)",
        quantity: "8 g",
        note: "Para que se vean dentro de la base transparente",
      },
      { name: "Miel de abejas", quantity: "5 g" },
      { name: "Manteca de karité", quantity: "5 g", note: "Sobreengrase" },
      { name: "Extracto de manzanilla", quantity: "2 g", note: "Calmante" },
      { name: "Aceite de avena", quantity: "3 g" },
      { name: "Aroma de miel o de avena", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar la manteca de karité y los aceites." },
      { text: "Agregar la miel y mezclar hasta integrar." },
      { text: "Agregar la avena coloidal poco a poco, mezclando para que no grumee." },
      { text: "Agregar la betaína, el bloqueador y el extracto de manzanilla." },
      { text: "A 55–58 °C, agregar el aroma y el fijador." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar y envolver en film DE INMEDIATO." },
      { text: "Reposar 24 horas antes de usar." },
    ],
    benefits: [
      { ingredient: "Avena coloidal", text: "Calma la piel y alivia el picor. Protector cutáneo." },
      { ingredient: "Miel", text: "Humectante. Aporta el polen de las flores." },
      { ingredient: "Manzanilla", text: "Calmante." },
      { ingredient: "Karité", text: "Sobreengrase: no reseca." },
    ],
  },

  {
    slug: "jabon-lavanda-marmoleado",
    name: "Jabón marmoleado de lavanda",
    category: "jabon",
    productSku: "LIL-JAB-LAV",
    summary: "Relajante y exfoliante, con efecto marmoleado.",
    yield: "250 g de base (125 g blanca + 125 g transparente)",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    notes: [
      "El efecto relajante funciona por inhalación con el vapor de la ducha, y para eso hace falta ACEITE ESENCIAL de lavanda. Una fragancia sintética huele igual pero no tiene los compuestos que producen el efecto.",
      "Las dos bases tienen que estar a temperatura parecida al verter. Si una está más caliente se mezclan del todo y se pierde el marmoleado.",
      "Rociar con alcohol entre capas es lo que hace que se peguen y el jabón no se parta por la unión.",
      "Los gránulos exfoliantes van solo en la base blanca.",
    ],
    ingredients: [
      { name: "Base de glicerina blanca", quantity: "125 g" },
      { name: "Base de glicerina transparente", quantity: "125 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Aceite esencial de lavanda",
        optionGroup: "lavanda",
        optionLabel: "Aceite esencial (recomendado)",
        isRecommended: true,
        quantity: "5 g",
        percentage: 2,
        note: "Al 2 %. Es lo único que sostiene la afirmación de relajante",
      },
      {
        name: "Aroma a lavanda",
        optionGroup: "lavanda",
        optionLabel: "Fragancia",
        quantity: "20 gotas",
        note: "Ya disponible. Huele igual pero sin efecto por inhalación",
      },
      {
        name: "Ultramarino violeta",
        optionGroup: "color-lavanda",
        optionLabel: "Ultramarino violeta",
        isRecommended: true,
        quantity: "0.5 g",
        note: "Pigmento mineral. Reemplaza al colorante sintético",
      },
      {
        name: "Colorante violeta",
        optionGroup: "color-lavanda",
        optionLabel: "Colorante violeta",
        quantity: "4 gotas",
        note: "Ya disponible",
      },
      {
        name: "Gránulos exfoliantes de frutilla",
        quantity: "3 g",
        linkedSlug: "granulos-frutilla",
        note: "Solo en la base blanca",
      },
      { name: "Manteca de karité", quantity: "5 g", note: "Sobreengrase" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar." },
      { text: "Derretir la base blanca en un recipiente y la transparente en otro, ambas a 60–65 °C." },
      { text: "Repartir la betaína, el bloqueador, el karité y el aroma entre las dos. Mezclar cada una." },
      { text: "Colorear la transparente con el ultramarino. La blanca queda sin color." },
      { text: "Agregar los gránulos exfoliantes solo a la base blanca y mezclar." },
      { text: "Dejar que ambas bajen a la misma temperatura, alrededor de 57 °C. Este paso decide el marmoleado." },
      { text: "Rociar el molde con alcohol." },
      { text: "Verter las dos a la vez, desde lados opuestos, formando el marmoleado." },
      { text: "Rociar la superficie con alcohol." },
      { text: "Dejar solidificar, cubrir y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Aceite esencial de lavanda", text: "Relajante por inhalación con el vapor." },
      { ingredient: "Gránulos de frutilla", text: "Exfoliante suave." },
      { ingredient: "Karité", text: "Sobreengrase: no reseca." },
    ],
  },

  {
    slug: "jabon-pepino",
    name: "Jabón de pepino",
    category: "jabon",
    productSku: "LIL-JAB-PEP",
    summary: "Refrescante de verdad, para piel grasa.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    notes: [
      "El mentol es lo que convierte «frescura» en una sensación real: activa los receptores de frío de la piel. Sin él, la frescura es solo una idea.",
      "CUIDADO con el mentol: empezar con la mitad de lo indicado y probar. Un exceso arde, sobre todo en zonas sensibles.",
      "La arcilla verde reemplaza al colorante y además absorbe sebo.",
      "Las escamas de jabón endurecen la barra: 1 g por cada 250 g de base.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Arcilla verde",
        optionGroup: "color-pepino",
        optionLabel: "Arcilla verde",
        isRecommended: true,
        quantity: "5 g",
        note: "Da el color y absorbe sebo. Reemplaza al colorante",
      },
      {
        name: "Colorante verde",
        optionGroup: "color-pepino",
        optionLabel: "Colorante verde",
        quantity: "1 gota",
        note: "Ya disponible. Solo da color",
      },
      {
        name: "Mentol cristalizado",
        optionGroup: "frescura",
        optionLabel: "Mentol",
        isRecommended: true,
        quantity: "0.5 g",
        percentage: 0.2,
        note: "EMPEZAR CON LA MITAD y probar. Al 0.2 % refresca; más arde",
      },
      {
        name: "Aceite esencial de menta",
        optionGroup: "frescura",
        optionLabel: "Esencial de menta",
        quantity: "1.5 g",
        note: "Efecto más suave que el mentol y aporta aroma",
      },
      {
        name: "Sin agente refrescante",
        optionGroup: "frescura",
        optionLabel: "Omitir",
        quantity: "—",
        note: "El jabón limpia igual pero no refresca",
      },
      { name: "Polvo de pepino", quantity: "2 g", linkedSlug: "polvo-pepino" },
      { name: "Extracto de pepino", quantity: "3 g" },
      { name: "Aceite de coco", quantity: "3 g", linkedSlug: "aceite-coco", note: "Sobreengrase" },
      { name: "Escamas de jabón", quantity: "1 g", optional: true, note: "Para que la barra quede más dura" },
      { name: "Aroma", quantity: "15 gotas", note: "Aloe Essence queda muy bien en este" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Mascarilla para la arcilla." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Si se usan escamas de jabón, agregarlas ahora y dejar que se integren." },
      { text: "Retirar del calor. Agregar la arcilla verde y mezclar hasta que no queden grumos." },
      { text: "Agregar la betaína, el bloqueador, el extracto de pepino y el aceite de coco." },
      { text: "Agregar el polvo de pepino y mezclar." },
      { text: "A 55–58 °C, agregar el mentol, el aroma y el fijador. Mezclar hasta disolver el mentol." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar, cubrir y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Mentol", text: "Sensación de frescura real sobre la piel." },
      { ingredient: "Arcilla verde", text: "Absorbe sebo. Deja la piel mate." },
      { ingredient: "Polvo de pepino", text: "Suaviza y aporta antioxidantes." },
      { text: "Para piel grasa. Previene el aspecto brillante." },
    ],
  },

  {
    slug: "jabon-naranja",
    name: "Jabón de naranja",
    category: "jabon",
    productSku: "LIL-JAB-NAR",
    summary: "Cítrico para piel grasa. Hidrata y aporta antioxidantes.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    notes: [
      "Usar naranja DULCE. La bergamota y la lima son mucho más fotosensibilizantes.",
      "Los cítricos son para piel grasa: naranja, limón, mandarina o toronja. Para cada uno, el glicerado del mismo cítrico.",
      "En jabón el riesgo de fotosensibilidad es bajo porque se enjuaga. En un producto que se queda en la piel sería otra conversación.",
      "Derretir a 60–65 °C, aroma a 55–58 °C.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      { name: "Glicerado de naranja", quantity: "5 g", linkedSlug: "glicerado-citricos" },
      { name: "Polvo de naranja", quantity: "3 g", linkedSlug: "polvo-naranja" },
      {
        name: "Aceite esencial de naranja dulce",
        optionGroup: "aroma-naranja",
        optionLabel: "Esencial de naranja dulce",
        isRecommended: true,
        quantity: "4 g",
        note: "Naranja DULCE. Es el cítrico menos fotosensibilizante",
      },
      {
        name: "Aroma de naranja",
        optionGroup: "aroma-naranja",
        optionLabel: "Fragancia de naranja",
        quantity: "1/4 cucharadita",
        note: "Ya disponible",
      },
      {
        name: "Cúrcuma en polvo",
        optionGroup: "color-naranja",
        optionLabel: "Cúrcuma (pizca)",
        isRecommended: true,
        quantity: "0.2 g",
        note: "Color natural. Poquísima: tiñe mucho",
      },
      {
        name: "Colorante amarillo",
        optionGroup: "color-naranja",
        optionLabel: "Colorante amarillo",
        quantity: "1 gota",
        note: "Ya disponible",
      },
      { name: "Aceite de coco", quantity: "3 g", linkedSlug: "aceite-coco", note: "Sobreengrase" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar." },
      { text: "Derretir la base de glicerina a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar el polvo de naranja y la cúrcuma, y mezclar." },
      { text: "Agregar la betaína, el bloqueador, el glicerado y el aceite de coco." },
      { text: "A 55–58 °C, agregar el aceite esencial y el fijador." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar, cubrir y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Glicerado de naranja", text: "Humecta y aporta antioxidantes." },
      { ingredient: "Polvo de naranja", text: "Aroma natural y suavidad." },
      { ingredient: "Aceite de coco", text: "Sobreengrase: no reseca." },
      { text: "Indicado para piel grasa." },
    ],
  },

  {
    slug: "jabon-sabila",
    name: "Jabón de sábila",
    category: "jabon",
    productSku: "LIL-JAB-SAB",
    summary: "Calmante y regenerador, con aloe concentrado.",
    yield: "250 g de base",
    restTime: "24 horas",
    phValue: "9 – 10",
    phKind: "esperado",
    notes: [
      "Se quitó el alcohol cetílico: en un jabón solo mata la espuma, y media cucharada era bastante. Junto con la manteca y los aceites, dejaba este jabón con mucha menos espuma que los demás.",
      "El aloe en polvo concentrado 200:1 es aloe de verdad. El «aceite de sábila» suele ser aceite portador con un poco de extracto.",
      "La ramita de romero por un minuto no extrae nada: o va aceite esencial, o va un aceite macerado en romero durante semanas.",
      "La manteca de cacao subió de 1 g a 5 g: a 0.4 % no se notaba.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      BETAINA,
      BLOQUEADOR,
      {
        name: "Aloe vera en polvo 200:1",
        optionGroup: "aloe",
        optionLabel: "Aloe en polvo 200:1",
        isRecommended: true,
        quantity: "1.5 g",
        note: "Aloe concentrado de verdad. Se disuelve antes en un poco de agua",
      },
      {
        name: "Aceite de sábila",
        optionGroup: "aloe",
        optionLabel: "Aceite de sábila",
        quantity: "4 g",
        note: "Ya disponible. Suele ser aceite portador con extracto",
      },
      {
        name: "Aceite esencial de romero",
        optionGroup: "romero",
        optionLabel: "Esencial de romero",
        isRecommended: true,
        quantity: "1.5 g",
        note: "Reemplaza a la ramita, que no alcanzaba a extraer nada",
      },
      {
        name: "Aceite macerado en romero",
        optionGroup: "romero",
        optionLabel: "Aceite macerado",
        quantity: "5 g",
        note: "Romero macerado en aceite por varias semanas",
      },
      {
        name: "Sin romero",
        optionGroup: "romero",
        optionLabel: "Omitir",
        quantity: "—",
      },
      {
        name: "Aceite esencial de árbol de té",
        quantity: "2 g",
        note: "Regenerador y antimicrobiano",
      },
      { name: "Manteca de cacao", quantity: "5 g", note: "Sobreengrase" },
      {
        name: "Arcilla verde",
        optionGroup: "color-sabila",
        optionLabel: "Arcilla verde",
        isRecommended: true,
        quantity: "3 g",
        note: "Color natural",
      },
      {
        name: "Colorante verde",
        optionGroup: "color-sabila",
        optionLabel: "Colorante verde",
        quantity: "1 gota",
      },
      { name: "Aroma de sábila", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Disolver el aloe en polvo en 5 g de agua destilada." },
      { text: "Derretir la base de glicerina y la manteca de cacao a baño maría, hasta 60–65 °C." },
      { text: "Retirar del calor. Agregar la arcilla y mezclar hasta que no queden grumos." },
      { text: "Agregar la betaína, el bloqueador y el aloe disuelto." },
      { text: "A 55–58 °C, agregar los aceites esenciales, el aroma y el fijador." },
      { text: "Rociar el molde con alcohol y verter a 55–60 °C." },
      { text: "Rociar la superficie, dejar solidificar, cubrir y reposar 24 horas." },
    ],
    benefits: [
      { ingredient: "Aloe vera", text: "Calma y ayuda a la regeneración de la piel." },
      { ingredient: "Árbol de té", text: "Antimicrobiano y regenerador." },
      { ingredient: "Manteca de cacao", text: "Sobreengrase: no reseca." },
    ],
  },

  // ═══════════════════ CREMAS ═══════════════════

  {
    slug: "crema-blanqueadora",
    name: "Crema despigmentante con niacinamida",
    category: "crema",
    productSku: "LIL-EXT-CRB",
    summary: "Atenúa manchas y unifica el tono. Con niacinamida al 4 %.",
    yield: "250 g",
    phValue: "5.0 – 6.0",
    phKind: "objetivo",
    usage:
      "Aplicar en rostro, cuello y orejas, de noche. Usar protector solar durante el día: sin protección, ningún despigmentante gana la carrera contra el sol.",
    notes: [
      "La niacinamida es el cambio de fondo. La fórmula anterior no contenía ningún despigmentante: el Q10, la alantoína y la centella son buenos ingredientes pero no actúan sobre la ruta de la melanina.",
      "Mantener el pH entre 5 y 6. Por debajo de 5 la niacinamida puede convertirse en ácido nicotínico y producir enrojecimiento pasajero.",
      "SE QUITÓ la afirmación de protector solar. El óxido de zinc y el dióxido de titanio mezclados a mano no dan protección medible ni uniforme, y alguien podría confiar en ella y quemarse. Se dejan en cantidad baja como barrera física ligera.",
      "Los polvos minerales se dispersan primero en un poco de aceite hasta formar pasta lisa. Echados directo sobre la crema fría quedan grumos y vetas.",
      "La alantoína y la centella se movieron a la crema humectante, donde su función calmante sí corresponde.",
      "Usar mascarilla al pesar el óxido de zinc y el dióxido de titanio.",
    ],
    ingredients: [
      { name: "Crema base", quantity: "200 g", linkedSlug: "crema-base" },
      {
        name: "Niacinamida",
        quantity: "10 g",
        percentage: 4,
        note: "Al 4 %. Disolver en un poco de agua destilada tibia antes de incorporar",
      },
      {
        name: "Alfa-arbutina",
        optionGroup: "despigmentante-extra",
        optionLabel: "Alfa-arbutina",
        isRecommended: true,
        quantity: "2.5 g",
        percentage: 1,
        optional: true,
        note: "Refuerza: inhibe la tirosinasa, el paso previo a la melanina",
      },
      {
        name: "Ácido tranexámico",
        optionGroup: "despigmentante-extra",
        optionLabel: "Ácido tranexámico",
        quantity: "5 g",
        percentage: 2,
        optional: true,
        note: "El de mejor evidencia para melasma",
      },
      {
        name: "Sin refuerzo",
        optionGroup: "despigmentante-extra",
        optionLabel: "Solo niacinamida",
        quantity: "—",
        note: "La niacinamida sola ya funciona",
      },
      { name: "Aceite de rosa mosqueta", quantity: "5 g" },
      { name: "Vitamina E", quantity: "0.75 g", percentage: 0.3, note: "Antioxidante" },
      { ...QUELANTE, quantity: "0.5 g" },
      ...conservante("1.25 g", 0.5),
      { name: "Óxido de zinc", quantity: "2.5 g", note: "Dispersar antes en aceite" },
      { name: "Dióxido de titanio", quantity: "2.5 g", note: "Dispersar antes en aceite" },
      { name: "Aroma", quantity: "1.25 g", note: "La fórmula anterior no llevaba nada" },
      { name: "Fijador de aroma", quantity: "0.5 g" },
      { name: "Ácido láctico", quantity: "Cantidad necesaria", note: "Solo para ajustar el pH" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Mascarilla puesta para los polvos minerales." },
      { text: "Disolver la niacinamida en 15 g de agua destilada tibia hasta que quede transparente." },
      { text: "En un recipiente aparte, dispersar el óxido de zinc y el dióxido de titanio en el aceite de rosa mosqueta, hasta pasta lisa sin grumos." },
      { text: "Colocar la crema base en un bol." },
      { text: "Incorporar la pasta de minerales y mezclar bien." },
      { text: "Agregar la niacinamida disuelta y el despigmentante de refuerzo si se usa." },
      { text: "Agregar el EDTA, la vitamina E y el conservante." },
      { text: "Batir con batidora de inmersión en tandas cortas hasta que quede homogénea." },
      { text: "Agregar el aroma y el fijador, y mezclar suave." },
      { text: "Medir el pH diluido 1:9 y ajustar a 5.0–6.0." },
      { text: "Envasar, etiquetar con lote y fecha, y guardar muestra de retención." },
    ],
    benefits: [
      { ingredient: "Niacinamida", text: "Reduce la transferencia de melanina. Atenúa manchas y unifica el tono." },
      { ingredient: "Alfa-arbutina", text: "Inhibe la tirosinasa, enzima clave en la formación de melanina." },
      { ingredient: "Rosa mosqueta", text: "Emoliente y antioxidante." },
      { ingredient: "Vitamina E", text: "Antioxidante." },
      { ingredient: "Óxido de zinc y dióxido de titanio", text: "Barrera física ligera. NO sustituye a un protector solar." },
    ],
  },

  {
    slug: "crema-humectante",
    name: "Crema extra humectante",
    category: "crema",
    summary: "Humectación profunda para piel muy seca. Con urea al 5 %.",
    yield: "250 g",
    phValue: "5.0 – 5.5",
    phKind: "objetivo",
    usage: "Rostro y cuerpo. Especialmente en piel seca o áspera.",
    notes: [
      "La urea subió de menos de 0.5 % a 5 %. A esa concentración es humectante Y queratolítica suave: ablanda la piel áspera. Por debajo de 2 % prácticamente no hace nada.",
      "La urea se hidroliza y suelta amoníaco, y el proceso se acelera con calor y pH alcalino. Por eso el control de pH aquí no es opcional: es lo que define cuánto dura la crema.",
      "La alantoína y la centella asiática vinieron de la crema despigmentante, donde no cumplían función. Aquí sí: calman y suavizan.",
      "La goma xantana se mezcla primero con los aceites: así se diluye sin grumos.",
      "Verificar con el proveedor a qué concentración viene el ácido láctico y las ceramidas. Sin ese dato no se sabe si se está poniendo lo correcto.",
    ],
    ingredients: [
      { name: "Crema base", quantity: "200 g", linkedSlug: "crema-base" },
      {
        name: "Urea cosmética",
        quantity: "12.5 g",
        percentage: 5,
        note: "Al 5 %. Disolver en 15 g de agua destilada antes de incorporar",
      },
      { name: "Pantenol", quantity: "2.5 g", percentage: 1, note: "Calmante y suavizante" },
      { name: "Alantoína", quantity: "1.25 g", percentage: 0.5, note: "Calma y suaviza" },
      { name: "Centella asiática", quantity: "2.5 g", note: "Calmante y reparador" },
      { name: "Ceramidas", quantity: "1.25 g", note: "Refuerzan la barrera cutánea" },
      ...faseGrasa("15 g"),
      { name: "Manteca de karité", quantity: "10 g", note: "Oclusivo" },
      { name: "Goma xantana", quantity: "0.5 g", note: "Mezclar primero con los aceites" },
      { name: "Vitamina E", quantity: "0.75 g", percentage: 0.3 },
      { ...QUELANTE, quantity: "0.5 g" },
      ...conservante("1.25 g", 0.5),
      { name: "Ácido láctico", quantity: "Cantidad necesaria", note: "Para ajustar el pH a 5.0–5.5" },
      { name: "Aroma", quantity: "2.5 g" },
      { name: "Fijador de aroma", quantity: "1 g" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar." },
      { text: "Disolver la urea en 15 g de agua destilada. Disolver aparte la alantoína en un poco de agua tibia." },
      { text: "Mezclar la goma xantana con la fase grasa hasta que no queden grumos." },
      { text: "Colocar la crema base en un bol e incorporar la fase grasa con la xantana." },
      { text: "Agregar la manteca de karité derretida y templada." },
      { text: "Agregar la urea disuelta, la alantoína, el pantenol y la centella." },
      { text: "Agregar las ceramidas, la vitamina E, el EDTA y el conservante." },
      { text: "Batir con batidora de inmersión en tandas cortas." },
      { text: "Agregar el aroma y el fijador." },
      { text: "Medir el pH diluido 1:9 y ajustar a 5.0–5.5. Este paso define cuánto dura la crema." },
      { text: "Envasar, etiquetar con lote y fecha, y guardar muestra de retención." },
    ],
    benefits: [
      { ingredient: "Urea 5 %", text: "Humecta y ablanda la piel áspera." },
      { ingredient: "Pantenol", text: "Calma y suaviza." },
      { ingredient: "Ceramidas", text: "Refuerzan la barrera cutánea." },
      { ingredient: "Alantoína y centella", text: "Calman la piel irritada." },
      { ingredient: "Karité y fase grasa", text: "Sellan para que el agua no se escape." },
    ],
  },

  // ═══════════════════ AGUA MICELAR ═══════════════════

  {
    slug: "agua-micelar",
    name: "Agua micelar",
    category: "otro",
    productSku: "LIL-EXT-AMI",
    summary: "Limpia y retira maquillaje sin enjuague.",
    yield: "250 g",
    phValue: "5.0 – 5.5",
    phKind: "objetivo",
    usage:
      "Empapar un algodón y pasar suavemente por rostro, cuello y contorno de ojos. No requiere enjuague.",
    notes: [
      "El cambio de fondo: baja la betaína del 3 % al 1 % y entra un tensioactivo micelar. Con 3 % de betaína el producto hacía espuma y obligaba a enjuagar, que es justo lo contrario de lo que se espera de un agua micelar.",
      "SE QUITÓ el aceite de árbol de té. A 0.008 % no tenía acción antimicrobiana, y sin solubilizante no se disolvía: lo que llegaba al algodón era una gota de aceite esencial puro sobre la cara.",
      "SE QUITÓ la afirmación de que retira células muertas. No lleva ácidos ni exfoliante: retira maquillaje y residuos, que es distinto.",
      "Es el producto de mayor riesgo microbiano de toda la línea: 94 % de agua, sin alcohol, con extracto vegetal, usado en la cara durante semanas. El conservante bien dosificado aquí no es opcional.",
      "No envasar en frasco reutilizado. Un envase con tapa abatible o dispensador se contamina mucho menos que uno de boca ancha.",
      "El té verde aporta sobre todo a la etiqueta: su valor antioxidante requiere quedarse en la piel, y esto se pasa con algodón.",
    ],
    ingredients: [
      { name: "Agua destilada", quantity: "230 g" },
      {
        name: "PEG-6 caprylic/capric glycerides",
        optionGroup: "micelar",
        optionLabel: "PEG-6 caprylic/capric (recomendado)",
        isRecommended: true,
        quantity: "7.5 g",
        percentage: 3,
        note: "El tensioactivo micelar clásico. Levanta el maquillaje sin espuma y sin enjuague. También solubiliza el aroma",
      },
      {
        name: "Poloxámero 188",
        optionGroup: "micelar",
        optionLabel: "Poloxámero 188",
        quantity: "5 g",
        percentage: 2,
        note: "Alternativa equivalente",
      },
      {
        name: "PEG-40 aceite de ricino hidrogenado",
        optionGroup: "micelar",
        optionLabel: "PEG-40 ricino hidrogenado",
        quantity: "7.5 g",
        percentage: 3,
        note: "Es el que usa el agua micelar comercial de referencia. También sirve de solubilizante",
      },
      {
        name: "Betaína de coco",
        quantity: "2.5 g",
        percentage: 1,
        note: "Bajó del 3 % al 1 %. Ahora acompaña en vez de ser la principal",
      },
      { name: "Glicerina vegetal", quantity: "5 g", percentage: 2, note: "Deslizamiento y humectación" },
      { name: "Pantenol", quantity: "1.25 g", percentage: 0.5, note: "Calmante" },
      { name: "Alantoína", quantity: "0.5 g", percentage: 0.2, note: "Calmante. Disolver en agua tibia" },
      { name: "Extracto de té verde", quantity: "2.5 g" },
      { ...QUELANTE, quantity: "0.5 g", note: "Potencia el conservante y ayuda a arrastrar los pigmentos del maquillaje" },
      {
        name: "Conservante",
        optionGroup: "conservante-micelar",
        optionLabel: "Fenoxietanol + etilhexilglicerina",
        isRecommended: true,
        quantity: "1.9 g",
        percentage: 0.75,
        note: "Es el que usa el producto comercial de referencia. Verificar el porcentaje en la ficha del proveedor",
      },
      { name: "Aroma", quantity: "1 g", optional: true },
      { name: "Ácido láctico", quantity: "Cantidad necesaria", note: "Para ajustar el pH a 5.0–5.5" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Sanitizar el envase con alcohol al 70 % y dejarlo secar por completo." },
      { text: "Colocar el agua destilada en un recipiente limpio." },
      { text: "Disolver el EDTA y la glicerina, y mezclar." },
      { text: "Disolver la alantoína aparte en un poco de agua tibia e incorporar." },
      { text: "Agregar el tensioactivo micelar y mezclar suave, sin batir, para no generar espuma." },
      { text: "Agregar la betaína y mezclar." },
      { text: "Agregar el pantenol y el extracto de té verde." },
      { text: "Si se usa aroma, mezclarlo primero con un poco del tensioactivo micelar y luego incorporar." },
      { text: "Agregar el conservante y mezclar." },
      { text: "Medir el pH y ajustar a 5.0–5.5." },
      { text: "Envasar, etiquetar con lote y fecha, y guardar muestra de retención." },
    ],
    benefits: [
      { text: "Retira maquillaje y residuos del día." },
      { text: "Limpia sin resecar y no requiere enjuague." },
      { ingredient: "Glicerina y pantenol", text: "Dejan la piel suave, sin sensación de tirantez." },
      { ingredient: "Alantoína", text: "Calma la piel." },
    ],
  },

  {
    slug: "agua-micelar-bifasica",
    name: "Agua micelar bifásica",
    category: "otro",
    summary: "Dos fases. Retira maquillaje resistente al agua.",
    yield: "200 g",
    phValue: "5.0 – 5.5",
    phKind: "objetivo",
    container: "Frasco transparente, para que se vean las dos capas",
    usage:
      "Agitar bien antes de cada uso. Empapar un algodón y presionar unos segundos sobre el maquillaje antes de arrastrar. Para maquillaje muy resistente, repetir.",
    notes: [
      "El agua micelar normal no quita maquillaje a prueba de agua. Esta sí: la fase oleosa disuelve lo que el agua no puede.",
      "Es la receta más fácil de toda la línea: NO lleva emulsionante. La gracia es justamente que las dos fases no se mezclen.",
      "Las dos capas separadas se ven muy bien en el frasco y venden solas en foto. Usar envase transparente.",
      "La fase acuosa es la que se puede contaminar, así que el conservante va calculado sobre el total.",
      "Proporción 30 % aceite / 70 % agua. Con más aceite limpia mejor pero deja más residuo graso.",
    ],
    ingredients: [
      // Fase oleosa
      {
        name: "Triglicéridos caprílico/cáprico",
        optionGroup: "fase-oleosa",
        optionLabel: "Caprílico/cáprico (recomendado)",
        isRecommended: true,
        quantity: "60 g",
        percentage: 30,
        note: "Ligero, seco, no deja sensación grasosa. El mejor para desmaquillar",
      },
      {
        name: "Aceite de jojoba",
        optionGroup: "fase-oleosa",
        optionLabel: "Jojoba",
        quantity: "60 g",
        percentage: 30,
        note: "Muy estable, no se enrancia",
      },
      {
        name: "Aceite de vaselina",
        optionGroup: "fase-oleosa",
        optionLabel: "Vaselina líquida (ya disponible)",
        quantity: "60 g",
        percentage: 30,
        note: "Ya está en el taller. Funciona, pero deja más sensación grasosa",
      },
      // Fase acuosa
      { name: "Agua destilada", quantity: "125 g" },
      { name: "Glicerina vegetal", quantity: "4 g", percentage: 2 },
      { name: "Pantenol", quantity: "1 g", percentage: 0.5 },
      { ...QUELANTE, quantity: "0.4 g" },
      {
        name: "Conservante",
        optionGroup: "conservante-bifasica",
        optionLabel: "Fenoxietanol + etilhexilglicerina",
        isRecommended: true,
        quantity: "1.5 g",
        percentage: 0.75,
      },
      { name: "Colorante hidrosoluble", quantity: "1 gota", optional: true, note: "Solo en la fase acuosa: resalta la separación" },
      { name: "Ácido láctico", quantity: "Cantidad necesaria", note: "Para ajustar el pH de la fase acuosa" },
    ],
    steps: [
      { text: "Pesar todo antes de empezar. Sanitizar el envase con alcohol al 70 % y secarlo por completo." },
      { text: "FASE ACUOSA: en un recipiente, disolver el EDTA y la glicerina en el agua destilada." },
      { text: "Agregar el pantenol y, si se usa, el colorante." },
      { text: "Agregar el conservante y mezclar." },
      { text: "Medir el pH de la fase acuosa y ajustar a 5.0–5.5." },
      { text: "FASE OLEOSA: pesar el aceite aparte. No necesita nada más." },
      { text: "Verter primero la fase acuosa en el envase final, y encima la oleosa." },
      { text: "NO agitar ni emulsionar: las dos capas tienen que quedar separadas." },
      { text: "Etiquetar con lote, fecha y la instrucción de agitar antes de usar." },
    ],
    benefits: [
      { text: "Retira maquillaje resistente al agua, que el agua micelar normal no puede." },
      { ingredient: "Fase oleosa", text: "Disuelve el maquillaje graso y el de larga duración." },
      { ingredient: "Fase acuosa", text: "Arrastra los residuos y deja la piel fresca." },
      { ingredient: "Pantenol", text: "Calma y evita la sensación de tirantez." },
    ],
  },

  // ═══════════════════ PERFUMES ═══════════════════
  // Sin cambios respecto al dictado original.

  {
    slug: "perfume-alcohol",
    name: "Perfume en alcohol",
    category: "perfume",
    summary: "Proporción distinta para mujer y para hombre.",
    yield: "100 g",
    restTime: "72 horas de curado",
    notes: [
      "Se usa alcohol compuesto, también llamado alcohol para perfumería: ya viene preparado, no es alcohol puro. Se pide así en Flora Síntesis.",
      "En perfumes de hombre la fragancia va más cargada.",
      "Curado: poner el frasco dentro de uno de vidrio más grande, taparlo y colocar el perfume boca abajo. Dejar en la puerta de la refrigeradora 72 horas.",
    ],
    ingredients: [
      { name: "Alcohol compuesto", quantity: "75 %", variant: "Mujer" },
      { name: "Fragancia", quantity: "25 %", variant: "Mujer" },
      { name: "Alcohol compuesto", quantity: "50 %", variant: "Hombre" },
      { name: "Fragancia", quantity: "50 %", variant: "Hombre" },
    ],
    steps: [
      { text: "Mezclar el alcohol compuesto con la fragancia en la proporción de la variante." },
      { text: "Envasar." },
      { text: "Dejar curar 72 horas boca abajo en la puerta de la refrigeradora." },
    ],
  },

  {
    slug: "perfume-vaselinado",
    name: "Perfume vaselinado",
    category: "perfume",
    productSku: "LIL-EXT-PVA",
    summary: "El aroma permanece en la superficie de la piel.",
    container: "Cajita de metal",
    ingredients: [
      { name: "Vaselina sólida simple", quantity: "1 cucharada" },
      { name: "Propilenglicol", quantity: "10 gotas" },
      { name: "Fijador de perfume", quantity: "10 gotas" },
      { name: "Sellador de perfume", quantity: "10 gotas" },
      { name: "Fragancia para perfume", quantity: "1/2 cucharadita" },
      { name: "Glicerina", quantity: "10 gotas" },
      { name: "Colorante", quantity: "Cantidad necesaria" },
    ],
    steps: [
      { text: "En un recipiente resistente al calor, derretir la vaselina a baño maría." },
      { text: "Agregar el propilenglicol, la glicerina, el fijador y el sellador. Mezclar." },
      { text: "Agregar el aroma y mezclar." },
      { text: "Agregar el colorante y mezclar bien." },
      { text: "Verter en el envase final." },
    ],
    benefits: [
      {
        text: "Para personas a las que la fragancia no se les queda en la piel: la vaselina no se absorbe, así que el aroma permanece en la superficie.",
      },
    ],
  },

  {
    slug: "perfume-oleoso",
    name: "Perfume oleoso (en aceite)",
    category: "perfume",
    productSku: "LIL-EXT-PAC",
    summary: "Dura más en el cuerpo que el perfume en alcohol.",
    container: "Frasco de rolón",
    ingredients: [
      { name: "Fragancia", quantity: "10 g" },
      { name: "Aceite de vaselina", quantity: "10 g" },
      { name: "Sellador de perfume", quantity: "5 gotas" },
      { name: "Fijador de perfume", quantity: "5 gotas" },
      { name: "Colorante", optional: true },
    ],
    steps: [{ text: "Mezclar todos los ingredientes en un recipiente y envasar." }],
    benefits: [
      {
        text: "El aceite hace que la fragancia dure más en el cuerpo y se desvanezca menos. Recomendado para personas a las que se les va el perfume con facilidad.",
      },
    ],
  },
];
