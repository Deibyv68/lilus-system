/**
 * Catálogo de materias primas de LILUS.
 *
 * Sale de los ingredientes que aparecen en el recetario, más los
 * recomendados en docs/analisis-recetas.md.
 *
 * IMPORTANTE sobre los datos técnicos: solo están llenos donde se conocen
 * con certeza (ficha del proveedor, etiqueta o dato verificable). Un
 * porcentaje de uso inventado es peor que un campo vacío, porque se ve
 * igual de confiable. Los campos en blanco son la lista de fichas técnicas
 * que hay que pedir.
 */

export type MaterialCategory =
  | "base"
  | "tensioactivo"
  | "emulsionante"
  | "conservante"
  | "activo"
  | "acido"
  | "aceite"
  | "esencial"
  | "arcilla"
  | "vegetal"
  | "colorante"
  | "aroma"
  | "auxiliar";

export type MaterialSeed = {
  slug: string;
  name: string;
  category: MaterialCategory;
  inciName?: string;
  tradeName?: string;
  manufacturer?: string;
  purpose?: string;
  usageMin?: number;
  usageMax?: number;
  phMin?: number;
  phMax?: number;
  maxTemp?: number;
  solubility?: "agua" | "aceite" | "ambas" | "dispersable";
  leaveOn?: boolean;
  spectrum?: string;
  incompatible?: string;
  container?: string;
  storage?: "ambiente" | "refrigerado";
  lightSensitive?: boolean;
  oxygenSensitive?: boolean;
  moistureSensitive?: boolean;
  openedShelfLife?: string;
  notes?: string;
};

export const MATERIALS: MaterialSeed[] = [
  // ═══════════════ BASES ═══════════════
  {
    slug: "base-glicerina-transparente",
    name: "Base de glicerina transparente",
    category: "base",
    purpose: "Base de los jabones. Se derrite y se moldea (melt & pour).",
    maxTemp: 65,
    phMin: 9,
    phMax: 10,
    container: "Bolsa o envase original, bien cerrado",
    storage: "ambiente",
    moistureSensitive: true,
    notes:
      "Derretir a 60–65 °C. Por encima de 70 se degrada, amarillea y suda más. El pH de 9–10 lo trae de fábrica y no se puede cambiar de forma útil.",
  },
  {
    slug: "base-glicerina-blanca",
    name: "Base de glicerina blanca",
    category: "base",
    purpose: "Igual que la transparente, pero opaca. Para marmoleados y jabones cremosos.",
    maxTemp: 65,
    phMin: 9,
    phMax: 10,
    container: "Bolsa o envase original, bien cerrado",
    storage: "ambiente",
    moistureSensitive: true,
  },
  {
    slug: "escamas-jabon",
    name: "Escamas de jabón",
    category: "base",
    purpose: "Endurecen la barra de jabón.",
    container: "Frasco hermético",
    storage: "ambiente",
    moistureSensitive: true,
    notes: "1 g por cada 250 g de base de glicerina.",
  },

  // ═══════════════ TENSIOACTIVOS ═══════════════
  {
    slug: "betaina-coco",
    name: "Betaína de coco",
    category: "tensioactivo",
    inciName: "Cocamidopropyl Betaine",
    purpose:
      "Suaviza el lavado y mejora la espuma. En jabones va al 2 %; en agua micelar acompaña a un tensioactivo micelar.",
    solubility: "agua",
    container: "Envase original",
    storage: "ambiente",
    notes:
      "En el agua micelar comercial de referencia aparece como segundo ingrediente. Por encima del 2 % hace espuma y obliga a enjuagar.",
  },
  {
    slug: "peg6-caprilico-caprico",
    name: "PEG-6 caprylic/capric glycerides",
    category: "tensioactivo",
    inciName: "PEG-6 Caprylic/Capric Glycerides",
    purpose:
      "Tensioactivo micelar. Levanta el maquillaje sin espuma y sin enjuague. También sirve de solubilizante.",
    solubility: "agua",
    leaveOn: true,
    container: "Envase original",
    storage: "ambiente",
    notes:
      "PENDIENTE COMPRAR. Es el ingrediente que convierte el limpiador en agua micelar de verdad. También se vende como Cetiol HE.",
  },
  {
    slug: "poloxamero-188",
    name: "Poloxámero 188",
    category: "tensioactivo",
    inciName: "Poloxamer 188",
    purpose: "Tensioactivo micelar. Alternativa al PEG-6.",
    solubility: "agua",
    leaveOn: true,
    notes: "PENDIENTE COMPRAR. Pedir ficha técnica para el porcentaje de uso.",
  },
  {
    slug: "peg40-ricino",
    name: "PEG-40 aceite de ricino hidrogenado",
    category: "tensioactivo",
    inciName: "PEG-40 Hydrogenated Castor Oil",
    purpose:
      "Solubilizante: mete aceites y fragancias en agua sin que se separen. También sirve de tensioactivo micelar.",
    solubility: "agua",
    leaveOn: true,
    container: "Envase original",
    storage: "ambiente",
    notes:
      "PENDIENTE COMPRAR. Es el que usa el agua micelar comercial de referencia. Para solubilizar un aceite esencial: 3 a 5 partes por cada parte de aceite, mezclando los dos PRIMERO y agregando después al agua.",
  },

  // ═══════════════ EMULSIONANTES Y ESPESANTES ═══════════════
  {
    slug: "dehyquart",
    name: "Dehyquart",
    category: "emulsionante",
    tradeName: "Dehyquart (también se vende como «Deicuar»)",
    purpose: "Emulsionante catiónico de las cremas.",
    maxTemp: 80,
    incompatible:
      "Ingredientes aniónicos: al ser catiónico, la emulsión se corta. Ojo con extractos y tensioactivos aniónicos.",
    container: "Envase original bien cerrado",
    storage: "ambiente",
    notes:
      "Es un éster y se hidroliza por encima de 80 °C. Debe entrar a 70–75 °C, nunca a agua hirviendo: a 100 °C se rompe parte del emulsionante justo al incorporarlo. Pedir ficha técnica para el porcentaje de uso.",
  },
  {
    slug: "alcohol-cetilico",
    name: "Alcohol cetílico",
    category: "emulsionante",
    inciName: "Cetyl Alcohol",
    purpose: "Espesante y coemulsionante de las cremas.",
    solubility: "aceite",
    container: "Envase hermético",
    storage: "ambiente",
    notes:
      "En jabón NO: reduce mucho la espuma. Se quitó de la receta del jabón de sábila por eso.",
  },
  {
    slug: "goma-xantana",
    name: "Goma xantana",
    category: "emulsionante",
    inciName: "Xanthan Gum",
    purpose: "Espesante y estabilizante. También humectante.",
    solubility: "agua",
    container: "Frasco hermético",
    storage: "ambiente",
    moistureSensitive: true,
    notes:
      "Se grumea con facilidad. Mezclarla primero con los aceites o con glicerina antes de que toque el agua.",
  },

  // ═══════════════ CONSERVANTES ═══════════════
  {
    slug: "kemidant-l",
    name: "Kemidant L",
    category: "conservante",
    inciName: "DMDM Hydantoin (and) Water",
    tradeName: "Kemidant L",
    manufacturer: "Akema",
    purpose: "Conservante de amplio espectro.",
    usageMin: 0.2,
    usageMax: 0.5,
    phMin: 3,
    phMax: 9,
    maxTemp: 80,
    solubility: "agua",
    spectrum: "Bacterias Gram (−), Gram (+) y mohos",
    container: "Envase original",
    storage: "ambiente",
    notes:
      "Es un liberador de formaldehído: así es como funciona. Legal y efectivo, pero en producto facial que se queda en la piel hay opciones con mejor perfil. Está bien para jabones y aceptable en cremas; en agua micelar se prefiere el fenoxietanol.",
  },
  {
    slug: "fenoxietanol-ehg",
    name: "Fenoxietanol + etilhexilglicerina",
    category: "conservante",
    inciName: "Phenoxyethanol (and) Ethylhexylglycerin",
    purpose: "Conservante de amplio espectro, sin liberadores de formaldehído.",
    solubility: "agua",
    leaveOn: true,
    container: "Envase original",
    storage: "ambiente",
    notes:
      "PENDIENTE COMPRAR. Es el sistema que usa el agua micelar comercial de referencia. Se vende con nombres como Euxyl PE 9010, Optiphen Plus o Microcare PHG. El fenoxietanol suele ir de 0.5 a 1 %: confirmar en la ficha del proveedor.",
  },

  // ═══════════════ ACTIVOS ═══════════════
  {
    slug: "niacinamida",
    name: "Niacinamida",
    category: "activo",
    inciName: "Niacinamide",
    purpose:
      "Despigmentante: reduce la transferencia de melanina. Además mejora la barrera cutánea y regula el sebo.",
    usageMin: 2,
    usageMax: 5,
    phMin: 5,
    phMax: 7,
    solubility: "agua",
    leaveOn: true,
    container: "Frasco hermético, al abrigo de la luz",
    storage: "ambiente",
    moistureSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Es el activo con mejor relación evidencia/precio de toda la línea. Por debajo de pH 5 puede convertirse en ácido nicotínico y producir enrojecimiento pasajero. Disolver en agua tibia antes de incorporar.",
  },
  {
    slug: "alfa-arbutina",
    name: "Alfa-arbutina",
    category: "activo",
    inciName: "Alpha-Arbutin",
    purpose: "Despigmentante: inhibe la tirosinasa.",
    usageMin: 1,
    usageMax: 2,
    solubility: "agua",
    leaveOn: true,
    lightSensitive: true,
    notes: "PENDIENTE COMPRAR. Pedir ficha técnica para pH y temperatura máxima.",
  },
  {
    slug: "acido-tranexamico",
    name: "Ácido tranexámico",
    category: "activo",
    inciName: "Tranexamic Acid",
    purpose: "Despigmentante, el de mejor evidencia para melasma.",
    usageMin: 2,
    usageMax: 3,
    solubility: "agua",
    leaveOn: true,
    notes: "PENDIENTE COMPRAR. Pedir ficha técnica.",
  },
  {
    slug: "urea-cosmetica",
    name: "Urea cosmética",
    category: "activo",
    inciName: "Urea",
    purpose: "Humectante y queratolítica suave: ablanda la piel áspera.",
    usageMin: 2,
    usageMax: 10,
    solubility: "agua",
    leaveOn: true,
    moistureSensitive: true,
    container: "Frasco hermético",
    storage: "ambiente",
    notes:
      "Se hidroliza en agua y suelta amoníaco; el proceso se acelera con calor y pH alcalino. Por eso el control de pH en la crema humectante no es opcional. Por debajo del 2 % prácticamente no hace nada.",
  },
  {
    slug: "pantenol",
    name: "Pantenol",
    category: "activo",
    inciName: "Panthenol",
    purpose: "Calmante y suavizante. Mejora la barrera cutánea.",
    usageMin: 0.5,
    usageMax: 2,
    solubility: "agua",
    leaveOn: true,
  },
  {
    slug: "alantoina",
    name: "Alantoína",
    category: "activo",
    inciName: "Allantoin",
    purpose: "Calmante y suavizante.",
    usageMin: 0.1,
    usageMax: 0.5,
    solubility: "agua",
    leaveOn: true,
    notes:
      "Poco soluble: disolver en agua tibia antes de incorporar. NO es despigmentante, aunque así figuraba en la receta original de la crema blanqueadora.",
  },
  {
    slug: "centella-asiatica",
    name: "Centella asiática",
    category: "activo",
    purpose: "Calmante y reparador.",
    leaveOn: true,
    notes: "Pedir ficha técnica: el porcentaje depende de la concentración del extracto.",
  },
  {
    slug: "ceramidas",
    name: "Ceramidas",
    category: "activo",
    inciName: "Ceramide NP / complejo",
    purpose: "Refuerzan la barrera cutánea.",
    leaveOn: true,
    notes:
      "Funcionan a porcentajes muy bajos y suelen venderse prediluidas a concentraciones muy distintas según proveedor. Sin la ficha técnica no se sabe si se está poniendo lo correcto o pagando por diluyente.",
  },
  {
    slug: "colageno-hidrolizado",
    name: "Colágeno hidrolizado",
    category: "activo",
    inciName: "Hydrolyzed Collagen",
    purpose: "Sensación sedosa en cremas. En productos que se enjuagan, aporta a la etiqueta más que a la piel.",
    solubility: "agua",
    container: "VIDRIO ÁMBAR — no plástico transparente",
    storage: "refrigerado",
    lightSensitive: true,
    oxygenSensitive: true,
    notes:
      "El culpable del olor a huevo de julio de 2026. Es una proteína con aminoácidos azufrados: con luz y oxígeno se degrada y suelta compuestos de azufre (olor a huevo) y aminas (olor a pescado). El problema apareció al cambiar de frasco ámbar de vidrio a plástico transparente. Fraccionar en frascos pequeños al comprarlo, para no abrir el grande veinte veces.",
  },
  {
    slug: "elastina",
    name: "Elastina",
    category: "activo",
    inciName: "Hydrolyzed Elastin",
    purpose: "Sensación sedosa en cremas.",
    solubility: "agua",
    container: "Vidrio ámbar",
    storage: "refrigerado",
    lightSensitive: true,
    oxygenSensitive: true,
  },
  {
    slug: "aloe-polvo-200",
    name: "Aloe vera en polvo 200:1",
    category: "activo",
    inciName: "Aloe Barbadensis Leaf Juice Powder",
    purpose: "Aloe concentrado de verdad. Calma y ayuda a la regeneración.",
    solubility: "agua",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Disolver en agua antes de incorporar. El «aceite de sábila» que se usaba antes suele ser aceite portador con un poco de extracto.",
  },
  {
    slug: "q10",
    name: "Coenzima Q10",
    category: "activo",
    inciName: "Ubiquinone",
    purpose: "Antioxidante.",
    solubility: "aceite",
    lightSensitive: true,
    notes:
      "Es liposoluble: hay que disolverlo en la fase grasa en caliente. Echado en polvo sobre crema fría queda en partículas. NO es despigmentante, aunque así figuraba en la receta original.",
  },
  {
    slug: "tintura-benjui",
    name: "Tintura de benjuí",
    category: "activo",
    purpose: "Rejuvenecedor de tejidos. También tiene efecto conservante leve.",
  },

  // ═══════════════ ÁCIDOS ═══════════════
  {
    slug: "acido-lactico",
    name: "Ácido láctico",
    category: "acido",
    inciName: "Lactic Acid",
    purpose:
      "Ajustar el pH de cremas y aguas micelares. En concentración alta es un AHA exfoliante.",
    solubility: "agua",
    notes:
      "Confirmar con el proveedor a qué concentración viene. Si es alta y se usa como activo, hay que controlar el pH y advertir sobre la exposición al sol.",
  },
  {
    slug: "acido-hialuronico",
    name: "Ácido hialurónico",
    category: "activo",
    inciName: "Sodium Hyaluronate",
    purpose: "Humectante de alto peso molecular.",
    solubility: "agua",
    leaveOn: true,
    notes:
      "Se quitó de los jabones: en un producto que se enjuaga no puede actuar. Sirve en cremas.",
  },

  // ═══════════════ ACEITES Y MANTECAS ═══════════════
  {
    slug: "escualano",
    name: "Escualano",
    category: "aceite",
    inciName: "Squalane",
    purpose: "Emoliente ligero, de tacto seco. Imita el sebo humano.",
    solubility: "aceite",
    leaveOn: true,
    container: "Frasco oscuro",
    storage: "ambiente",
    notes:
      "PENDIENTE COMPRAR. Muy estable: no se enrancia. Es el que mejor acabado da de todas las opciones de fase grasa.",
  },
  {
    slug: "aceite-jojoba",
    name: "Aceite de jojoba",
    category: "aceite",
    inciName: "Simmondsia Chinensis Seed Oil",
    purpose: "Emoliente. Técnicamente es una cera, no un aceite.",
    solubility: "aceite",
    leaveOn: true,
    container: "Frasco oscuro",
    notes: "Al ser cera no se enrancia como los aceites. Muy parecido al sebo humano.",
  },
  {
    slug: "aceite-almendra",
    name: "Aceite de almendra",
    category: "aceite",
    inciName: "Prunus Amygdalus Dulcis Oil",
    purpose: "Emoliente y sobreengrase.",
    solubility: "aceite",
    container: "Frasco oscuro",
    storage: "ambiente",
    oxygenSensitive: true,
    openedShelfLife: "6 meses",
    notes: "Se enrancia. Usar vitamina E y anotar la fecha de apertura.",
  },
  {
    slug: "aceite-rosa-mosqueta",
    name: "Aceite de rosa mosqueta",
    category: "aceite",
    inciName: "Rosa Canina Fruit Oil",
    purpose: "Emoliente y antioxidante.",
    solubility: "aceite",
    container: "Frasco ámbar",
    storage: "refrigerado",
    lightSensitive: true,
    oxygenSensitive: true,
    openedShelfLife: "6 meses",
    notes: "Se enrancia con facilidad. Guardar en frío.",
  },
  {
    slug: "aceite-calendula",
    name: "Aceite de caléndula",
    category: "aceite",
    purpose: "Calmante para piel irritada.",
    solubility: "aceite",
    container: "Frasco oscuro",
  },
  {
    slug: "aceite-linaza",
    name: "Aceite de linaza",
    category: "aceite",
    inciName: "Linum Usitatissimum Seed Oil",
    purpose: "Emoliente.",
    solubility: "aceite",
    container: "Frasco ámbar",
    storage: "refrigerado",
    oxygenSensitive: true,
    notes: "De los que más rápido se enrancian.",
  },
  {
    slug: "aceite-avena",
    name: "Aceite de avena",
    category: "aceite",
    purpose: "Emoliente y calmante.",
    solubility: "aceite",
  },
  {
    slug: "aceite-vaselina",
    name: "Aceite de vaselina",
    category: "aceite",
    inciName: "Paraffinum Liquidum / Mineral Oil",
    purpose: "Oclusivo. También sirve de fase oleosa en la micelar bifásica.",
    solubility: "aceite",
    container: "Envase original",
    storage: "ambiente",
    notes: "Es de origen mineral. Muy estable: no se enrancia.",
  },
  {
    slug: "triglicerido-caprilico",
    name: "Triglicéridos caprílico/cáprico",
    category: "aceite",
    inciName: "Caprylic/Capric Triglyceride",
    purpose: "Aceite ligero y seco. El mejor para desmaquillar en la micelar bifásica.",
    solubility: "aceite",
    leaveOn: true,
    notes: "PENDIENTE COMPRAR. Muy estable.",
  },
  {
    slug: "manteca-karite",
    name: "Manteca de karité",
    category: "aceite",
    inciName: "Butyrospermum Parkii Butter",
    purpose: "Oclusivo y emoliente. Sella para que el agua no se escape.",
    solubility: "aceite",
    leaveOn: true,
    container: "Frasco hermético",
    storage: "ambiente",
    notes: "En jabón, por encima del 3 % empieza a reducir la espuma.",
  },
  {
    slug: "manteca-cacao",
    name: "Manteca de cacao",
    category: "aceite",
    inciName: "Theobroma Cacao Seed Butter",
    purpose: "Oclusivo. Endurece y aporta aroma.",
    solubility: "aceite",
    storage: "ambiente",
  },
  {
    slug: "aceite-coco",
    name: "Aceite de coco",
    category: "aceite",
    purpose: "Emoliente. Se fabrica en el taller.",
    solubility: "aceite",
    container: "Frasco de vidrio ámbar",
    storage: "refrigerado",
    oxygenSensitive: true,
    openedShelfLife: "3 meses",
    notes:
      "Ver la receta en el recetario. Lleva aceite de vaselina, así que el producto final es una mezcla, no aceite de coco puro.",
  },
  {
    slug: "vaselina-solida",
    name: "Vaselina sólida",
    category: "aceite",
    inciName: "Petrolatum",
    purpose: "Base del perfume vaselinado.",
    solubility: "aceite",
    storage: "ambiente",
  },

  // ═══════════════ ACEITES ESENCIALES ═══════════════
  {
    slug: "ae-arbol-te",
    name: "Aceite esencial de árbol de té",
    category: "esencial",
    inciName: "Melaleuca Alternifolia Leaf Oil",
    purpose: "Antimicrobiano y regenerador.",
    usageMin: 0.5,
    usageMax: 1,
    solubility: "aceite",
    container: "Frasco ámbar",
    storage: "ambiente",
    lightSensitive: true,
    oxygenSensitive: true,
    notes:
      "Para que tenga acción antimicrobiana hace falta 0.5–1 %. En agua NO se disuelve solo: necesita solubilizante, o queda flotando y llega a la piel sin diluir, que es irritante.",
  },
  {
    slug: "ae-lavanda",
    name: "Aceite esencial de lavanda",
    category: "esencial",
    inciName: "Lavandula Angustifolia Oil",
    purpose: "Relajante por inhalación. Es lo único que sostiene esa afirmación.",
    usageMin: 1,
    usageMax: 2,
    solubility: "aceite",
    container: "Frasco ámbar",
    lightSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Una fragancia sintética de lavanda huele igual pero no tiene los compuestos que producen el efecto.",
  },
  {
    slug: "ae-romero",
    name: "Aceite esencial de romero",
    category: "esencial",
    inciName: "Rosmarinus Officinalis Leaf Oil",
    purpose: "Tonificante y aromático.",
    solubility: "aceite",
    container: "Frasco ámbar",
    notes:
      "PENDIENTE COMPRAR. Reemplaza a la ramita de romero, que en un minuto de infusión no alcanza a extraer nada.",
  },
  {
    slug: "ae-naranja-dulce",
    name: "Aceite esencial de naranja dulce",
    category: "esencial",
    inciName: "Citrus Sinensis Peel Oil",
    purpose: "Aroma cítrico.",
    solubility: "aceite",
    container: "Frasco ámbar",
    lightSensitive: true,
    oxygenSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Naranja DULCE específicamente: la bergamota y la lima son mucho más fotosensibilizantes. Los cítricos se oxidan rápido, guardar en frío.",
  },
  {
    slug: "ae-geranio",
    name: "Aceite esencial de geranio",
    category: "esencial",
    inciName: "Pelargonium Graveolens Oil",
    purpose: "Aroma rosado, mucho más económico que la rosa real.",
    solubility: "aceite",
    container: "Frasco ámbar",
    notes: "PENDIENTE COMPRAR.",
  },
  {
    slug: "ae-palmarosa",
    name: "Aceite esencial de palmarosa",
    category: "esencial",
    inciName: "Cymbopogon Martini Oil",
    purpose: "Aroma rosado más fresco que el geranio.",
    solubility: "aceite",
    container: "Frasco ámbar",
    notes: "PENDIENTE COMPRAR.",
  },
  {
    slug: "ae-menta",
    name: "Aceite esencial de menta",
    category: "esencial",
    inciName: "Mentha Piperita Oil",
    purpose: "Sensación de frescura y aroma.",
    solubility: "aceite",
    container: "Frasco ámbar",
    notes: "PENDIENTE COMPRAR. Efecto más suave que el mentol cristalizado.",
  },
  {
    slug: "mentol",
    name: "Mentol cristalizado",
    category: "esencial",
    inciName: "Menthol",
    purpose: "Frescura real: activa los receptores de frío de la piel.",
    usageMin: 0.1,
    usageMax: 0.3,
    solubility: "aceite",
    container: "Frasco hermético",
    storage: "ambiente",
    notes:
      "PENDIENTE COMPRAR. CUIDADO: empezar con la mitad de lo que se crea. Un exceso arde, sobre todo en zonas sensibles. Sublima: mantener el frasco bien cerrado.",
  },

  // ═══════════════ ARCILLAS Y MINERALES ═══════════════
  {
    slug: "caolin",
    name: "Arcilla blanca (caolín)",
    category: "arcilla",
    inciName: "Kaolin",
    purpose: "Suaviza la exfoliación, da deslizamiento. La más suave de las arcillas.",
    container: "Frasco hermético",
    storage: "ambiente",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR. Mascarilla al pesar: es polvo fino.",
  },
  {
    slug: "bentonita",
    name: "Arcilla bentonita",
    category: "arcilla",
    inciName: "Bentonite",
    purpose: "Absorbe sebo por intercambio iónico. Para piel grasa.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Es lo que se esperaba del ácido salicílico en el jabón de carbón, y a diferencia de este sí funciona a pH de jabón. Mascarilla al pesar.",
  },
  {
    slug: "rhassoul",
    name: "Arcilla rhassoul",
    category: "arcilla",
    inciName: "Moroccan Lava Clay",
    purpose: "Absorbe sebo, más suave que la bentonita.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR. Buena para piel sensible.",
  },
  {
    slug: "arcilla-verde",
    name: "Arcilla verde",
    category: "arcilla",
    inciName: "Illite",
    purpose: "Absorbe sebo y da color verde natural.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR. Reemplaza al colorante verde sintético.",
  },
  {
    slug: "arcilla-rosa",
    name: "Arcilla rosa",
    category: "arcilla",
    purpose: "Limpieza suave, tacto sedoso y color rosado natural.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR. Reemplaza al colorante rosado sintético.",
  },
  {
    slug: "carbon-activado",
    name: "Carbón activado en polvo",
    category: "arcilla",
    inciName: "Charcoal Powder",
    purpose: "Absorbe grasa y residuos por contacto. Da color negro.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "Mascarilla obligatoria al pesar: es de los polvos más finos y volátiles.",
  },
  {
    slug: "oxido-zinc",
    name: "Óxido de zinc",
    category: "arcilla",
    inciName: "Zinc Oxide",
    purpose: "Barrera física ligera. Calmante.",
    container: "Frasco hermético",
    notes:
      "MASCARILLA OBLIGATORIA al pesar. Dispersar en aceite hasta pasta lisa antes de incorporar a una crema: echado en polvo queda grumoso y con vetas. Mezclado a mano NO da protección solar medible.",
  },
  {
    slug: "dioxido-titanio",
    name: "Dióxido de titanio",
    category: "arcilla",
    inciName: "Titanium Dioxide",
    purpose: "Opacidad y barrera física ligera.",
    container: "Frasco hermético",
    notes:
      "MASCARILLA OBLIGATORIA al pesar: el polvo inhalado está clasificado como posible carcinógeno por vía respiratoria. Sobre la piel no hay problema. Dispersar en aceite antes de incorporar.",
  },
  {
    slug: "ultramarino-violeta",
    name: "Ultramarino violeta",
    category: "colorante",
    inciName: "Ultramarines",
    purpose: "Pigmento mineral violeta.",
    container: "Frasco hermético",
    notes: "PENDIENTE COMPRAR. Reemplaza al colorante violeta sintético.",
  },
  {
    slug: "mica",
    name: "Mica",
    category: "colorante",
    inciName: "Mica",
    purpose: "Color y brillo en cremas.",
    container: "Frasco hermético",
  },

  // ═══════════════ VEGETALES Y POLVOS ═══════════════
  {
    slug: "avena-coloidal",
    name: "Avena coloidal",
    category: "vegetal",
    inciName: "Avena Sativa Kernel Flour",
    purpose: "Protector cutáneo. Calma y alivia el picor, incluso enjuagándose.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes:
      "PENDIENTE COMPRAR. Es de los pocos activos con respaldo serio que funcionan en un producto que se enjuaga. La avena molida común solo exfolia.",
  },
  {
    slug: "avena-molida",
    name: "Avena molida",
    category: "vegetal",
    purpose: "Exfoliante suave.",
    container: "Frasco hermético",
    moistureSensitive: true,
  },
  {
    slug: "polvo-arroz",
    name: "Polvo de arroz",
    category: "vegetal",
    purpose: "Suaviza y da deslizamiento.",
    container: "Frasco hermético",
    moistureSensitive: true,
  },
  {
    slug: "leche-coco-polvo",
    name: "Leche de coco en polvo",
    category: "vegetal",
    purpose: "Espuma cremosa y ácido láctico natural.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR.",
  },
  {
    slug: "leche-cabra-polvo",
    name: "Leche de cabra en polvo",
    category: "vegetal",
    purpose: "Espuma cremosa. Más rica en grasa que la de coco.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "PENDIENTE COMPRAR.",
  },
  {
    slug: "maicena",
    name: "Maicena",
    category: "vegetal",
    purpose: "Textura y deslizamiento.",
    container: "Frasco hermético",
    moistureSensitive: true,
  },
  {
    slug: "cafe-granulado",
    name: "Café granulado",
    category: "vegetal",
    purpose: "Exfoliante. Absorbe olores.",
    container: "Frasco hermético",
    moistureSensitive: true,
    notes: "Para rostro hay que molerlo mucho más fino: el grano tiene aristas duras.",
  },
  {
    slug: "canela-polvo",
    name: "Canela en polvo",
    category: "vegetal",
    purpose: "Antioxidante y aroma.",
    container: "Frasco hermético",
    notes:
      "Sensibilizante conocido. No recomendarlo para piel sensible ni para niños.",
  },
  {
    slug: "curcuma-polvo",
    name: "Cúrcuma en polvo",
    category: "colorante",
    purpose: "Color amarillo natural.",
    container: "Frasco hermético",
    notes: "Tiñe muchísimo. Se usa en pizcas.",
  },
  {
    slug: "miel-abejas",
    name: "Miel de abejas",
    category: "vegetal",
    inciName: "Mel",
    purpose: "Humectante y nutritiva.",
    storage: "ambiente",
    notes:
      "Es azúcar: atrae humedad del aire. El jabón que la lleva es el que más suda, hay que envolverlo apenas se desmolda.",
  },
  {
    slug: "extracto-te-verde",
    name: "Extracto de té verde",
    category: "vegetal",
    inciName: "Camellia Sinensis Leaf Extract",
    purpose: "Antioxidante.",
    solubility: "agua",
    storage: "refrigerado",
    notes:
      "Si es extracto acuoso, aporta carga microbiana: el conservante tiene que estar bien dosificado. En un producto que se pasa con algodón, su valor es más de etiqueta que de piel.",
  },
  {
    slug: "extracto-manzanilla",
    name: "Extracto de manzanilla",
    category: "vegetal",
    inciName: "Chamomilla Recutita Flower Extract",
    purpose: "Calmante.",
  },
  {
    slug: "extracto-pepino",
    name: "Extracto de pepino",
    category: "vegetal",
    inciName: "Cucumis Sativus Fruit Extract",
    purpose: "Refrescante y suavizante.",
  },
  {
    slug: "agua-rosas",
    name: "Agua de rosas",
    category: "vegetal",
    inciName: "Rosa Damascena Flower Water",
    purpose: "Tónico suave.",
    solubility: "agua",
    storage: "refrigerado",
    notes: "Los hidrolatos se contaminan con facilidad. Guardar en frío y comprar poco.",
  },

  // ═══════════════ AUXILIARES ═══════════════
  {
    slug: "agua-destilada",
    name: "Agua destilada",
    category: "auxiliar",
    inciName: "Aqua",
    purpose: "Vehículo de cremas y aguas micelares.",
    container: "Envase original",
    storage: "ambiente",
    notes:
      "Deja de ser estéril al abrirse. Comprar envases pequeños y no guardar uno abierto durante meses.",
  },
  {
    slug: "glicerina-usp",
    name: "Glicerina USP",
    category: "auxiliar",
    inciName: "Glycerin",
    purpose: "Humectante. Da deslizamiento.",
    solubility: "agua",
    storage: "ambiente",
    moistureSensitive: true,
    notes: "Es higroscópica: atrae agua del aire. Mantener bien cerrada.",
  },
  {
    slug: "edta-disodico",
    name: "EDTA disódico",
    category: "auxiliar",
    inciName: "Disodium EDTA",
    purpose:
      "Quelante: potencia el conservante y evita que los metales oxiden la fórmula. En agua micelar además ayuda a arrastrar los pigmentos del maquillaje.",
    usageMin: 0.1,
    usageMax: 0.2,
    solubility: "agua",
    notes: "PENDIENTE COMPRAR. Barato y de los que más estabilidad aportan.",
  },
  {
    slug: "vitamina-e",
    name: "Vitamina E",
    category: "auxiliar",
    inciName: "Tocopherol",
    purpose: "Antioxidante: protege la fase grasa de enranciarse.",
    usageMin: 0.2,
    usageMax: 0.5,
    solubility: "aceite",
    container: "Frasco ámbar",
    lightSensitive: true,
    notes: "En la fórmula original iba a dosis casi simbólica.",
  },
  {
    slug: "alcohol-96",
    name: "Alcohol al 96 %",
    category: "auxiliar",
    inciName: "Alcohol Denat.",
    purpose: "Bloqueador de humedad y limpieza.",
    solubility: "agua",
    storage: "ambiente",
    notes:
      "Para DESINFECTAR usar al 70 %, no al 96 %: el de 96 deshidrata la pared de la bacteria tan rápido que la sella por fuera y no la mata.",
  },
  {
    slug: "alcohol-70",
    name: "Alcohol al 70 %",
    category: "auxiliar",
    purpose: "Sanitizar equipo y envases. Rociar moldes y jabones para quitar burbujas.",
    storage: "ambiente",
    notes: "Tener siempre uno en atomizador junto a la mesa de trabajo.",
  },
  {
    slug: "propilenglicol",
    name: "Propilenglicol",
    category: "auxiliar",
    inciName: "Propylene Glycol",
    purpose: "Solvente y humectante.",
    solubility: "agua",
    incompatible: "Poco compatible con vaselina: son de polaridad opuesta y pueden separarse.",
  },

  // ═══════════════ AROMAS Y PERFUMERÍA ═══════════════
  {
    slug: "fragancia-cosmetica",
    name: "Fragancia cosmética",
    category: "aroma",
    inciName: "Parfum",
    purpose: "Aroma. Genérico para las distintas fragancias del taller.",
    solubility: "aceite",
    container: "Frasco ámbar",
    notes:
      "En producto transparente con agua necesita solubilizante o queda turbio. Es de los ingredientes más frecuentes en alergias de contacto.",
  },
  {
    slug: "fijador-aroma",
    name: "Fijador de aroma",
    category: "aroma",
    purpose: "Hace que el aroma dure más.",
  },
  {
    slug: "sellador-perfume",
    name: "Sellador de perfume",
    category: "aroma",
    purpose: "Fija la fragancia en perfumería.",
  },
  {
    slug: "alcohol-compuesto",
    name: "Alcohol compuesto para perfumería",
    category: "aroma",
    purpose: "Base de los perfumes en alcohol. Ya viene preparado, no es alcohol puro.",
    storage: "ambiente",
    notes: "Se pide así en Flora Síntesis: «alcohol compuesto» o «alcohol para perfumería».",
  },

  // ═══════════════ COLORANTES ═══════════════
  {
    slug: "colorante-cosmetico",
    name: "Colorante cosmético",
    category: "colorante",
    purpose: "Color. Genérico para los distintos colorantes del taller.",
    notes:
      "En jabones se están reemplazando por arcillas y pigmentos minerales, que dan color y además cumplen función. Eso habilita decir «sin colorantes artificiales».",
  },
];
