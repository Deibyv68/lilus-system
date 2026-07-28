/**
 * Datos del recetario LILUS.
 *
 * Fuente: docs/recetario.md. Se cargan con scripts/seed-recetario.ts.
 * Las recetas se pueden editar después desde la app; esto es solo la
 * carga inicial.
 *
 * `linkedSlug` en un ingrediente indica que ese ingrediente se prepara
 * con otra receta. Es lo que permite saltar de "glicerado de naranja" a
 * su preparación.
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
  ingredients: {
    name: string;
    quantity?: string;
    note?: string;
    optional?: boolean;
    variant?: string;
    linkedSlug?: string;
  }[];
  steps: { text: string; variant?: string }[];
  benefits?: { ingredient?: string; text: string }[];
};

// Atajo: el bloqueador de humedad va en todos los jabones
const BLOQUEADOR = {
  name: "Bloqueador de humedad",
  quantity: "10 gotas",
  linkedSlug: "bloqueador-humedad",
};

export const RECIPES: RecipeSeed[] = [
  // ═══════════════════ PREPARACIONES BASE ═══════════════════
  {
    slug: "bloqueador-humedad",
    name: "Bloqueador de humedad",
    category: "base",
    summary: "Se necesita para todos los jabones.",
    yield: "Un frasco de 60 ml",
    ingredients: [
      { name: "Agua destilada", quantity: "1 cucharada" },
      { name: "Glicerina USP líquida", quantity: "1 cucharada" },
      { name: "Alcohol al 96 %", quantity: "1 cucharada", note: "También se lo conoce como etanol 96" },
    ],
    steps: [
      { text: "Mezclar todo bien en un recipiente." },
      { text: "Guardar en un frasco de 60 ml." },
      { text: "Agregar a los jabones según la cantidad que indique cada fórmula." },
    ],
  },

  {
    slug: "crema-base",
    name: "Crema base",
    category: "base",
    summary: "Base de las demás cremas, y también producto de uso directo.",
    usage:
      "Aplicar en cualquier tipo de piel, incluso grasosa. Masajear por 5 minutos y luego lavar. Se aplica pasando un día.",
    notes: [
      "Hay dos fórmulas, de dos maestros distintos. Las dos sirven.",
      "El Dehyquart también se vende escrito como «Deicuar».",
    ],
    ingredients: [
      { name: "Agua destilada", quantity: "1 taza", variant: "Profe Nelly" },
      { name: "Alcohol cetílico", quantity: "25 g", variant: "Profe Nelly" },
      { name: "Dehyquart", quantity: "25 g", variant: "Profe Nelly" },
      { name: "Conservante", quantity: "1/4 cucharadita", variant: "Profe Nelly" },

      { name: "Alcohol cetílico", quantity: "80 g", variant: "Ingeniero" },
      { name: "Dehyquart", quantity: "40 g", variant: "Ingeniero" },
      { name: "Glicerina", quantity: "15 g", variant: "Ingeniero" },
      { name: "Agua destilada caliente", quantity: "850 g", variant: "Ingeniero" },
    ],
    steps: [
      { text: "Poner a hervir la taza de agua destilada.", variant: "Profe Nelly" },
      { text: "Agregar el alcohol cetílico y dejar que se disuelva bien.", variant: "Profe Nelly" },
      { text: "Agregar el Dehyquart.", variant: "Profe Nelly" },
      { text: "Batir con espátula hasta que la crema se enfríe y tome espesor.", variant: "Profe Nelly" },
      { text: "Cuando haya cogido consistencia, dejar de batir y dejar enfriar.", variant: "Profe Nelly" },
      { text: "Ya totalmente fría, agregar el conservante. Rinde 500 g.", variant: "Profe Nelly" },

      { text: "Derretir el alcohol cetílico a baño maría hasta que esté completamente líquido.", variant: "Ingeniero" },
      { text: "Agregar la glicerina y dejar que se derrita.", variant: "Ingeniero" },
      { text: "Agregar el Dehyquart y dejar que se derrita por completo.", variant: "Ingeniero" },
      { text: "Con el agua destilada ya caliente, agregarla a la mezcla.", variant: "Ingeniero" },
      { text: "Batir con espátula por bastante tiempo, hasta que tome consistencia de crema.", variant: "Ingeniero" },
      { text: "Dejar reposar y enfriar totalmente.", variant: "Ingeniero" },
      { text: "Ya fría, agregar conservante para mejor duración. Rinde unos 985 g.", variant: "Ingeniero" },
    ],
    benefits: [{ text: "Retira células muertas de la piel, limpia y protege." }],
  },

  {
    slug: "aceite-coco",
    name: "Aceite de coco",
    category: "base",
    summary: "Aporta brillo, suavidad y humectación.",
    notes: [
      "El coco debe estar a término medio (semiduro).",
      "Conviene cernir dos veces.",
    ],
    ingredients: [
      { name: "Coco grande semiduro", quantity: "1" },
      { name: "Aceite de vaselina", quantity: "1/4 de taza", note: "Se puede subir hasta 1/2 taza" },
    ],
    steps: [
      { text: "Pelar el coco y cortar la corteza oscura." },
      { text: "Cortar en trocitos y licuar con 2 tazas de agua hirviendo." },
      { text: "Cernir en una tela limpia." },
      { text: "Colocar en un recipiente, tapar y refrigerar 3 horas." },
      { text: "Retirar la grasa que se separó del agua y secar la humedad." },
      { text: "Pasar a un recipiente resistente al calor y cocinar a fuego bajo hasta que se separe el aceite." },
      { text: "Agregar el aceite de vaselina y cocinar unos minutos más." },
      { text: "Cernir, dejar enfriar y envasar en frasco tapado." },
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
      "Además de usarse en los jabones, se puede aplicar en el rostro con un algodón, de día o de noche. Es mejor al levantarse: limpiar y luego lavar el rostro.",
    notes: [
      "Se pueden hacer jabones decorados con una rodaja de cítrico disecada con toda la cáscara: llenar el molde con glicerina hasta la mitad, colocar la rodaja, dejar solidificar un momento y agregar el resto.",
    ],
    ingredients: [
      { name: "Cáscaras de cítrico secas", quantity: "Cantidad necesaria" },
      { name: "Glicerina", quantity: "2 cucharadas" },
      { name: "Agua destilada", quantity: "2 cucharadas" },
      { name: "Conservante", quantity: "1/8 cucharadita" },
    ],
    steps: [
      { text: "Poner en una olla las cáscaras, la glicerina y el agua destilada.", variant: "A fuego directo" },
      { text: "Hervir bien 3 minutos y luego bajar el fuego.", variant: "A fuego directo" },
      { text: "Dejar enfriar y cernir.", variant: "A fuego directo" },
      { text: "Agregar el conservante.", variant: "A fuego directo" },

      { text: "Poner las cáscaras, la glicerina y el agua destilada en un frasquito y taparlo.", variant: "A baño maría" },
      { text: "Poner un trapo en el fondo de la olla y acomodar el frasco encima, para que no se mueva con el hervor.", variant: "A baño maría" },
      { text: "Tapar la olla y mantener 20 minutos.", variant: "A baño maría" },
      { text: "Dejar enfriar tapada.", variant: "A baño maría" },
      { text: "Ya frío, cernir y agregar el conservante.", variant: "A baño maría" },
    ],
    benefits: [
      { text: "Humecta la piel, es antioxidante y evita manchas." },
      { text: "Evita la obstrucción de poros, espinillas y acné." },
    ],
  },

  {
    slug: "polvo-naranja",
    name: "Polvo de naranja",
    category: "base",
    summary: "Igual para limón, mandarina o toronja.",
    notes: [
      "La cáscara se seca bajo sombra, nunca al sol directo: al sol pierde sus propiedades. Se puede secar tras una ventana.",
      "Este polvo aporta a los jabones un aroma único.",
    ],
    ingredients: [{ name: "Naranja", quantity: "1" }],
    steps: [
      { text: "Lavar la naranja y secarla." },
      { text: "Rallar la cáscara, tomando en lo posible solo la parte de color." },
      { text: "Poner a secar." },
    ],
  },

  {
    slug: "polvo-rosas",
    name: "Polvo de rosas",
    category: "base",
    summary: "Tres formas de secar los pétalos.",
    notes: [
      "Con cualquiera de los tres métodos, una vez secos los pétalos se trituran en molino eléctrico hasta obtener el polvo.",
    ],
    ingredients: [
      { name: "Rosas", quantity: "Cantidad necesaria" },
      { name: "Sal en grano", quantity: "Cantidad necesaria", optional: true, note: "Solo para el método con sal" },
    ],
    steps: [
      { text: "Sacar los pétalos y lavarlos.", variant: "Al aire" },
      { text: "Ponerlos a secar en un lugar con mucha claridad.", variant: "Al aire" },

      { text: "Extender papel aluminio, encima los pétalos y encima un paño.", variant: "Con plancha" },
      { text: "Pasar la plancha.", variant: "Con plancha" },

      { text: "Colocar las rosas boca abajo (pétalos hacia abajo, tallo hacia arriba) en un recipiente.", variant: "Con sal en grano" },
      { text: "Cubrir toda la rosa con sal en grano.", variant: "Con sal en grano" },
      { text: "Tapar y dejar una semana.", variant: "Con sal en grano" },
    ],
  },

  {
    slug: "polvo-pepino",
    name: "Polvo de pepino",
    category: "base",
    summary: "Se hace con la cáscara del pepino.",
    ingredients: [{ name: "Cáscara de pepino", quantity: "Cantidad necesaria" }],
    steps: [
      { text: "Pelar el pepino y reservar la cáscara." },
      { text: "Secar la cáscara al sol o con la plancha, hasta que quede muy seca." },
      { text: "Triturar en molino pequeño hasta que quede polvo." },
    ],
  },

  {
    slug: "granulos-frutilla",
    name: "Gránulos exfoliantes de frutilla",
    category: "base",
    summary: "Se aprovechan las pepitas del jugo de frutilla.",
    ingredients: [
      { name: "Frutillas", quantity: "Cantidad necesaria" },
      { name: "Alcohol", quantity: "Para rociar" },
    ],
    steps: [
      { text: "Hacer un jugo de frutilla. Quedan las pepitas." },
      { text: "Lavar bien las pepitas." },
      { text: "Extenderlas sobre una toalla de papel." },
      { text: "Rociar alcohol." },
      { text: "Poner a secar." },
    ],
  },

  // ═══════════════════ JABONES ═══════════════════
  {
    slug: "jabon-cafe",
    name: "Jabón de café",
    category: "jabon",
    productSku: "LIL-JAB-CAF",
    summary: "Exfoliante y purificador de poros, con canela.",
    yield: "250 g de base",
    restTime: "24 horas",
    usage: "Sirve para rostro, cuerpo y cabello.",
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Ácido láctico", quantity: "6 gotas" },
      BLOQUEADOR,
      { name: "Aceite de almendra", quantity: "4 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
      { name: "Canela en polvo", quantity: "1/8 cucharadita" },
      { name: "Café granulado", quantity: "1 cucharadita" },
      { name: "Aroma de café", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Colocar la base de glicerina en un recipiente y diluir a baño maría." },
      { text: "Aparte, mezclar todos los ingredientes líquidos." },
      { text: "Agregar esa mezcla a la glicerina derretida." },
      { text: "Agregar el café y la canela, y mezclar." },
      { text: "Colocar en moldes y dejar solidificar." },
      { text: "Cubrir con plástico film y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "No reseca la piel." },
      { text: "Exfoliante: retira células muertas." },
      { text: "Purificador de poros." },
      { text: "Elimina manchas de la piel." },
      { ingredient: "Canela", text: "Antioxidante." },
      { text: "Ayuda a proteger la piel." },
    ],
  },

  {
    slug: "jabon-carbon",
    name: "Jabón de carbón activado",
    category: "jabon",
    productSku: "LIL-JAB-CAR",
    summary: "Limpiador y protector facial. Controla la grasa.",
    yield: "250 g de base",
    restTime: "24 horas",
    usage: "Se puede usar desde los 12 años.",
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Ácido salicílico", quantity: "1/16 cucharadita" },
      { name: "Agua de rosas", quantity: "1 cucharadita" },
      BLOQUEADOR,
      { name: "Carbón activado en polvo", quantity: "1/4 cucharadita" },
      { name: "Aroma", quantity: "20 gotas" },
      { name: "Aceite de árbol de té", quantity: "4 gotas" },
      { name: "Aceite de caléndula", quantity: "4 gotas" },
      { name: "Ácido glicólico al 1 %", quantity: "2 gotas", note: "Para las manchas" },
    ],
    steps: [
      { text: "Colocar los ingredientes líquidos en un recipiente y mezclar." },
      { text: "Agregar el ácido salicílico y mezclar." },
      { text: "Aparte, colocar la base de glicerina y llevar a baño maría hasta diluir." },
      { text: "Agregar el carbón activado y mezclar." },
      { text: "Agregar la mezcla de ingredientes líquidos y mezclar." },
      { text: "Verter en moldes y dejar solidificar." },
      { text: "Reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Limpia y protege la piel." },
      { ingredient: "Ácido salicílico", text: "Controla la grasa, limpia la piel, evita manchas." },
      { ingredient: "Carbón activado", text: "Purifica poros, evita la segregación de grasa." },
      { ingredient: "Vitamina E", text: "Antioxidante." },
      { ingredient: "Aceite de árbol de té", text: "Regenerador de la piel." },
    ],
  },

  {
    slug: "jabon-arroz",
    name: "Jabón de arroz",
    category: "jabon",
    productSku: "LIL-JAB-ARR",
    summary: "Suavizante, hidratante y blanqueador.",
    yield: "250 g de base",
    restTime: "24 horas",
    usage: "Sirve para cuerpo y rostro.",
    ingredients: [
      { name: "Base de glicerina blanca", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Betaína de coco", quantity: "1 cucharadita" },
      { name: "Polvo de arroz", quantity: "1/2 cucharada" },
      { name: "Maicena", quantity: "1/2 cucharadita", note: "Disuelta en 1 cucharadita de agua de rosas" },
      { name: "Aceite de rosa mosqueta", quantity: "4 gotas" },
      { name: "Aroma", quantity: "20 gotas" },
      BLOQUEADOR,
      { name: "Fijador de aroma", quantity: "10 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
    ],
    steps: [
      { text: "Colocar todos los ingredientes líquidos en un recipiente y mezclar bien." },
      { text: "Aparte, colocar la base de glicerina y llevar a baño maría hasta disolver." },
      { text: "Agregar los ingredientes líquidos y mezclar bien." },
      { text: "Agregar la maicena y mezclar." },
      { text: "Agregar el arroz molido y mezclar bien." },
      { text: "Colocar en moldes y dejar solidificar." },
      { text: "Cubrir con plástico film y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Suavizante." },
      { text: "Hidratante y humectante." },
      { text: "Blanqueador." },
    ],
  },

  {
    slug: "jabon-rosas",
    name: "Jabón de rosas",
    category: "jabon",
    productSku: "LIL-JAB-ROS",
    summary: "Hidratante y blanqueador, aporta colágeno.",
    yield: "250 g de base",
    restTime: "24 horas",
    usage: "Para todo tipo de piel. Se puede usar en todo el cuerpo.",
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Aceite de rosa mosqueta", quantity: "4 gotas" },
      { name: "Aceite de linaza", quantity: "4 gotas" },
      { name: "Aroma de rosas", quantity: "10 gotas" },
      { name: "Fijador de aroma", quantity: "5 gotas" },
      BLOQUEADOR,
      { name: "Colorante rosado", quantity: "1 gota" },
      { name: "Polvo de rosas", quantity: "1/4 cucharadita", linkedSlug: "polvo-rosas" },
      { name: "Conservante", quantity: "4 gotas" },
    ],
    steps: [
      { text: "Colocar la base de glicerina en un recipiente, llevar a baño maría y diluir." },
      { text: "Aparte, mezclar los ingredientes líquidos." },
      { text: "Agregar esa mezcla a la base de glicerina y mezclar bien." },
      { text: "Agregar el polvo de rosas y mezclar." },
      { text: "Colocar en moldes y dejar solidificar." },
      { text: "Cubrir con papel film y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Hidratante." },
      { text: "Aporta colágeno." },
      { ingredient: "Aceite de rosa mosqueta", text: "Blanqueador y limpiador." },
      { text: "Retira células muertas." },
    ],
  },

  {
    slug: "jabon-avena-miel",
    name: "Jabón de avena y miel de abejas",
    category: "jabon",
    summary: "Nutritivo, exfoliante y limpiador.",
    yield: "250 g de base",
    restTime: "24 horas",
    notes: [
      "El tipo de avena depende de la base: en base transparente van hojuelas de avena; en base blanca, avena molida.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente o blanca", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      BLOQUEADOR,
      { name: "Ácido láctico", quantity: "4 gotas" },
      { name: "Avena molida", quantity: "1 cucharadita" },
      { name: "Ácido hialurónico", quantity: "4 gotas" },
      { name: "Extracto de manzanilla", quantity: "4 gotas" },
      { name: "Miel de abejas", quantity: "1 cucharadita" },
      { name: "Aceite de avena", quantity: "10 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
      { name: "Colorante amarillo", quantity: "1 gota", optional: true, note: "Si es necesario" },
      { name: "Aroma de miel de abejas o de avena", quantity: "20 gotas" },
    ],
    steps: [
      { text: "Colocar la base de glicerina en un recipiente y llevar a baño maría." },
      { text: "Aparte, mezclar el resto de aditivos." },
      { text: "Agregar esa mezcla a la base derretida y mezclar bien." },
      { text: "Colocar en moldes y dejar solidificar." },
      { text: "Cubrir con plástico film y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Nutritivo, exfoliante y limpiador." },
      { ingredient: "Miel de abejas", text: "Nutritiva por el polen de las flores que contiene." },
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
    notes: ["Los gránulos exfoliantes van solo en la base de glicerina blanca."],
    ingredients: [
      { name: "Base de glicerina blanca", quantity: "125 g" },
      { name: "Base de glicerina transparente", quantity: "125 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      BLOQUEADOR,
      { name: "Ácido láctico", quantity: "4 gotas" },
      { name: "Aroma a lavanda", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
      { name: "Aceite de lavanda", quantity: "10 gotas" },
      { name: "Gránulos exfoliantes", quantity: "1/4 cucharadita", linkedSlug: "granulos-frutilla" },
      { name: "Colorante violeta", quantity: "4 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
    ],
    steps: [
      { text: "Colocar la base de glicerina blanca en un recipiente y la transparente en otro. Llevar ambas a baño maría hasta diluir." },
      { text: "Aparte, mezclar los ingredientes líquidos." },
      { text: "Repartir esa mezcla: una parte en la base transparente y la otra en la base blanca. Mezclar cada una." },
      { text: "Agregar los gránulos exfoliantes a la glicerina blanca y mezclar." },
      { text: "Verter las dos mezclas a la vez en los moldes, formando el marmoleado." },
      { text: "Dejar solidificar." },
      { text: "Cubrir con papel de empaque y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { ingredient: "Ácido láctico", text: "Protege la piel y regula el pH." },
      { ingredient: "Lavanda", text: "Relajante." },
      { ingredient: "Gránulos", text: "Exfoliante." },
    ],
  },

  {
    slug: "jabon-pepino",
    name: "Jabón de pepino",
    category: "jabon",
    productSku: "LIL-JAB-PEP",
    summary: "Limpiador de manchas y antioxidante.",
    yield: "250 g de base",
    restTime: "24 horas",
    notes: [
      "Para que quede más duro, se puede agregar escamas de jabón: 1 g por cada 250 g de glicerina.",
      "En este jabón queda muy bien el aroma Aloe Essence.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Betaína de coco", quantity: "1 cucharadita" },
      BLOQUEADOR,
      { name: "Aceite de coco", quantity: "5 gotas", linkedSlug: "aceite-coco" },
      { name: "Glicerina USP", quantity: "5 gotas" },
      { name: "Aroma", quantity: "1/8 cucharadita" },
      { name: "Fijador de aroma", quantity: "1/8 cucharadita" },
      { name: "Extracto de pepino", quantity: "5 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
      { name: "Colorante verde", quantity: "1 gota" },
      { name: "Polvo de pepino", quantity: "1/4 cucharadita", linkedSlug: "polvo-pepino" },
    ],
    steps: [
      { text: "Colocar la base de glicerina en un recipiente y llevar a baño maría hasta derretir." },
      { text: "Aparte, mezclar los ingredientes líquidos." },
      { text: "Agregar esa mezcla a la base derretida y mezclar bien." },
      { text: "Agregar el polvo de pepino y mezclar." },
      { text: "Verter en moldes y dejar solidificar." },
      { text: "Reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Limpiador de manchas." },
      { text: "Antioxidante." },
      { text: "Previene manchas ocasionadas por el sol." },
    ],
  },

  {
    slug: "jabon-naranja",
    name: "Jabón de naranja",
    category: "jabon",
    productSku: "LIL-JAB-NAR",
    summary: "Cítrico para pieles grasosas. Hidrata y es antioxidante.",
    yield: "250 g de base",
    restTime: "24 horas",
    notes: [
      "Los jabones cítricos son para pieles grasosas. Pueden ser de naranja, limón, mandarina o toronja.",
      "Para cada uno se usa la cáscara del cítrico correspondiente, y hay que preparar antes el glicerado de ese cítrico.",
    ],
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "250 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      BLOQUEADOR,
      { name: "Betaína de coco", quantity: "1 cucharadita" },
      { name: "Glicerado de naranja", quantity: "1 cucharadita", linkedSlug: "glicerado-citricos" },
      { name: "Polvo de naranja", quantity: "1/2 cucharadita", linkedSlug: "polvo-naranja" },
      { name: "Conservante", quantity: "4 gotas" },
      { name: "Aceite de coco", quantity: "4 gotas", linkedSlug: "aceite-coco" },
      { name: "Aroma de naranja", quantity: "1/4 cucharadita" },
      { name: "Fijador de aroma", quantity: "1/8 cucharadita" },
      { name: "Colorante amarillo", quantity: "1 gota" },
    ],
    steps: [
      { text: "Colocar la base de glicerina y llevar a baño maría hasta derretir." },
      { text: "Agregar el polvo de naranja y mezclar." },
      { text: "Aparte, mezclar todos los aditivos líquidos." },
      { text: "Agregar esa mezcla a la base de glicerina y mezclar." },
      { text: "Colocar en moldes y dejar solidificar." },
      { text: "Reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Hidrata la piel." },
      { text: "Antioxidante." },
      { text: "Aporta aceites naturales a la piel." },
    ],
  },

  {
    slug: "jabon-sabila",
    name: "Jabón de sábila",
    category: "jabon",
    productSku: "LIL-JAB-SAB",
    summary: "Regenerador de tejidos, antioxidante y antiarrugas.",
    yield: "240 g de base",
    restTime: "24 horas",
    ingredients: [
      { name: "Base de glicerina transparente", quantity: "240 g" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Aceite de árbol de té", quantity: "4 gotas" },
      { name: "Aceite de sábila", quantity: "4 gotas" },
      { name: "Manteca de cacao", quantity: "1 g" },
      { name: "Alcohol cetílico", quantity: "1/2 cucharada" },
      { name: "Romero", quantity: "1 ramita" },
      { name: "Aroma de sábila", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
      { name: "Colorante verde", quantity: "1 gota" },
      { name: "Sábila en polvo", quantity: "1/8 cucharadita" },
    ],
    steps: [
      { text: "Colocar todos los ingredientes líquidos en un recipiente." },
      { text: "Aparte, colocar la base de glicerina transparente, el alcohol cetílico y la manteca de cacao, y diluir a baño maría." },
      { text: "Agregar la rama de romero y mezclar un minuto, para que suelte su aroma." },
      { text: "Retirar el romero." },
      { text: "Agregar la mezcla de ingredientes líquidos y el colorante, y mezclar bien." },
      { text: "Verter en moldes y dejar solidificar." },
      { text: "Cubrir con plástico film y reposar 24 horas antes de utilizarlo." },
    ],
    benefits: [
      { text: "Regenerador de tejidos." },
      { text: "Antioxidante." },
      { text: "Antiarrugas." },
    ],
  },

  // ═══════════════════ CREMAS ═══════════════════
  {
    slug: "crema-blanqueadora",
    name: "Crema blanqueadora con Q10 y alantoína",
    category: "crema",
    productSku: "LIL-EXT-CRB",
    summary: "Despigmentante, reduce manchas oscuras y melasmas.",
    usage: "Aplicar en rostro, cuello y orejas.",
    ingredients: [
      { name: "Crema base", quantity: "4 cucharadas", linkedSlug: "crema-base" },
      { name: "Alantoína (baba de caracol)", quantity: "4 gotas" },
      { name: "Tintura de benjuí", quantity: "6 gotas" },
      { name: "Q10", quantity: "1/16 cucharadita" },
      { name: "Centella asiática", quantity: "4 gotas" },
      { name: "Colágeno", quantity: "4 gotas" },
      { name: "Elastina", quantity: "4 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Ácido hialurónico", quantity: "4 gotas" },
      { name: "Aceite de rosa mosqueta o de avena", quantity: "10 gotas" },
      { name: "Conservante", quantity: "4 gotas" },
      { name: "Dióxido de titanio", quantity: "1/16 cucharadita" },
      { name: "Óxido de zinc", quantity: "1/16 cucharadita" },
    ],
    steps: [
      { text: "En un recipiente, colocar la crema base. Agregar el óxido de zinc y el dióxido de titanio, y mezclar bien." },
      { text: "Aparte, mezclar bien el resto de ingredientes." },
      { text: "Agregar esa mezcla a la crema y mezclar bien." },
    ],
    benefits: [
      { ingredient: "Alantoína", text: "Reduce manchas oscuras y melasmas." },
      { ingredient: "Tintura de benjuí", text: "Rejuvenecedor de tejidos." },
      { ingredient: "Q10", text: "Despigmenta la piel." },
      { ingredient: "Centella asiática", text: "Humecta la piel y purifica poros." },
      { ingredient: "Colágeno", text: "Humecta la piel y las arrugas." },
      { ingredient: "Elastina", text: "Activa la circulación sanguínea." },
      { ingredient: "Vitamina E", text: "Antioxidante, evita que la piel se manche." },
      { ingredient: "Ácido hialurónico", text: "Atenúa la piel." },
      { ingredient: "Rosa mosqueta", text: "Despigmenta la piel." },
      { ingredient: "Aceite de avena", text: "Estimulante y protector de la piel." },
      { ingredient: "Conservante", text: "Conservación cosmética." },
      { ingredient: "Óxido de zinc y dióxido de titanio", text: "Protector solar." },
    ],
  },

  {
    slug: "crema-humectante",
    name: "Crema extra humectante",
    category: "crema",
    summary: "Humectación profunda con ceramidas y urea.",
    yield: "125 g de crema base",
    notes: [
      "En vez de aceite de petróleo se puede usar vaselina líquida o aceite de silicona.",
      "La goma xantana se diluye mejor si se mezcla con los aceites.",
      "La urea cosmética se disuelve en agua destilada.",
      "Si la crema queda muy espesa, agregar agua destilada.",
      "Para dar color a las cremas se usa mica.",
    ],
    ingredients: [
      { name: "Crema base", quantity: "125 g", linkedSlug: "crema-base" },
      { name: "Pantenol", quantity: "6 gotas" },
      { name: "Aceite de petróleo", quantity: "1 cucharadita" },
      { name: "Colágeno", quantity: "6 gotas" },
      { name: "Elastina", quantity: "6 gotas" },
      { name: "Vitamina E", quantity: "4 gotas" },
      { name: "Ácido láctico", quantity: "6 gotas" },
      { name: "Goma xantana", quantity: "1/16 cucharadita", note: "Disuelta en 1 cucharada de agua destilada" },
      { name: "Urea cosmética", quantity: "1/8 cucharadita", note: "Disuelta en 1 cucharadita de agua" },
      { name: "Ceramidas", quantity: "10 gotas" },
      { name: "Aroma", quantity: "20 gotas" },
      { name: "Fijador de aroma", quantity: "10 gotas" },
      { name: "Conservante", quantity: "10 gotas" },
    ],
    steps: [
      { text: "Colocar la crema base en un recipiente." },
      { text: "Aparte, mezclar los ingredientes líquidos." },
      { text: "Agregar a la crema y mezclar bien." },
    ],
    benefits: [
      { ingredient: "Aceite de petróleo", text: "Humecta la piel." },
      { ingredient: "Goma xantana", text: "Humectante y espesante." },
    ],
  },

  // ═══════════════════ OTROS ═══════════════════
  {
    slug: "agua-micelar",
    name: "Agua micelar",
    category: "otro",
    productSku: "LIL-EXT-AMI",
    summary: "Limpia, retira maquillaje y purifica poros.",
    yield: "Aproximadamente 250 g",
    notes: ["Hay que enjuagar con agua normal después de usarla, porque contiene jabón."],
    ingredients: [
      { name: "Agua destilada", quantity: "235 g" },
      { name: "Glicerina vegetal líquida", quantity: "5 g" },
      { name: "Extracto de té verde", quantity: "2.5 g" },
      { name: "Betaína de coco", quantity: "7.5 g" },
      { name: "Aceite de árbol de té", quantity: "2 gotas" },
      { name: "Conservante cosmético", quantity: "10 gotas" },
      { name: "Aroma Johnson's Baby", quantity: "4 gotas" },
      { name: "Colorante", optional: true },
      { name: "Aroma adicional", quantity: "10 gotas", optional: true, note: "Manzanilla, argán, rosas o aloe vera" },
    ],
    steps: [
      { text: "Colocar el agua destilada en un recipiente." },
      { text: "Agregar la glicerina y mezclar." },
      { text: "Agregar el extracto de té verde y mezclar." },
      { text: "Agregar la betaína de coco y mezclar." },
      { text: "Agregar el aceite de árbol de té y mezclar." },
      { text: "Agregar el conservante y mezclar." },
    ],
    benefits: [
      { text: "Retira células muertas de la piel y residuos de maquillaje." },
      { text: "Purifica poros y protege la piel." },
      { ingredient: "Betaína", text: "Humectante, jabonosa y espumante." },
    ],
  },

  // ═══════════════════ PERFUMES ═══════════════════
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
      "Curado: poner el frasco dentro de uno de vidrio más grande, taparlo y colocar el perfume boca abajo para que se evapore el alcohol y se conserve la fragancia. Dejar en la puerta de la refrigeradora 72 horas.",
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
