/**
 * Diccionario del recetario.
 *
 * Regla de escritura: explicar como si se lo contaras a alguien que sabe
 * hacer jabón con las manos pero nunca estudió química. Sin fórmulas, sin
 * palabras que necesiten otra definición para entenderse, y siempre con
 * un ejemplo sacado de las propias recetas de LILUS.
 *
 * Los `aliases` son las otras formas en que aparece la palabra en los
 * textos: plurales, femenino, sinónimos. Es lo que permite detectarla y
 * enlazarla automáticamente dentro de una receta.
 */

export type GlossaryCategory =
  | "quimica"
  | "ingrediente"
  | "proceso"
  | "medida"
  | "seguridad";

export type GlossarySeed = {
  slug: string;
  term: string;
  aliases?: string[];
  shortDef: string;
  longDef?: string;
  example?: string;
  category: GlossaryCategory;
};

export const GLOSSARY: GlossarySeed[] = [
  // ═══════════════ CONCEPTOS QUÍMICOS ═══════════════
  {
    slug: "ph",
    term: "pH",
    category: "quimica",
    shortDef:
      "Un número del 0 al 14 que dice si algo es ácido o alcalino. La piel sana está alrededor de 5.",
    longDef:
      "Piensa en una regla del 0 al 14. Abajo del 7 están las cosas ácidas, como el limón o el vinagre. Arriba del 7 las alcalinas, como el jabón o el bicarbonato. El 7 justo en medio es el agua pura, que no es ni una cosa ni la otra.\n\nLa piel sana vive entre 4.7 y 5.5, o sea ligeramente ácida. Cuando le ponemos algo muy alejado de ahí, la piel se irrita o se reseca hasta que vuelve a acomodarse.\n\nPor eso en las cremas y en el agua micelar ajustamos el pH: para que lleguen a la piel más o menos donde ella ya está.",
    example:
      "El jabón de glicerina está en 9 o 10, bastante alcalino, y no se puede cambiar. Por eso el jabón siempre reseca un poco y por eso después conviene ponerse crema.",
  },
  {
    slug: "acido",
    term: "Ácido",
    aliases: ["ácidos", "ácida", "acidez", "acidificar"],
    category: "quimica",
    shortDef: "Algo con pH por debajo de 7, como el limón o el vinagre.",
    longDef:
      "En cosmética usamos ácidos suaves para dos cosas distintas.\n\nUna es bajar el pH de un producto hasta donde le gusta a la piel: para eso sirve el ácido láctico o el cítrico, en cantidades muy chiquitas.\n\nLa otra es como activo, en concentraciones mucho más altas, para que exfolien o traten algo. Ahí ya no es cuestión de ajustar sino de tratar, y hay que tener más cuidado.",
    example:
      "En la crema base agregamos unas gotas de ácido láctico solo hasta que el pH llegue a 5. No es para que exfolie: es para que la crema quede donde la piel la acepta.",
  },
  {
    slug: "alcalino",
    term: "Alcalino",
    aliases: ["alcalina", "alcalinos", "base", "básico"],
    category: "quimica",
    shortDef: "Lo contrario de ácido: pH por encima de 7. El jabón es alcalino.",
    longDef:
      "Todo jabón es alcalino, no hay forma de que no lo sea: así es como funciona el jabón. Esa es justamente la razón por la que un jabón limpia bien pero deja la piel un poco tirante.\n\nY también es la razón por la que muchos activos no sirven dentro de un jabón: en medio alcalino se desactivan o se degradan.",
    example:
      "El ácido salicílico necesita un medio ácido para trabajar. Dentro de un jabón, que es alcalino, se queda dormido: está ahí pero no hace nada.",
  },
  {
    slug: "cationico",
    term: "Catiónico",
    aliases: ["catiónica", "catiónicos", "catión"],
    category: "quimica",
    shortDef:
      "Ingrediente con carga eléctrica positiva. Se pega a la piel y al cabello, que tienen carga negativa.",
    longDef:
      "Algunos ingredientes tienen una carga eléctrica, como los imanes. Los catiónicos tienen carga positiva.\n\nLa piel y el cabello tienen carga negativa. Y como en los imanes, lo positivo se pega a lo negativo. Por eso los catiónicos se quedan pegados aunque enjuagues: eso es exactamente lo que hace que un acondicionador desenrede.\n\nEl detalle importante: si mezclas un catiónico con un aniónico, que tiene carga negativa, se pegan entre ellos en vez de pegarse al cabello, y los dos dejan de servir.",
    example:
      "El Dehyquart es catiónico. Por eso funciona en el acondicionador. Y por eso NO puede ir en un champú con texapón: el texapón es aniónico y se anulan entre sí.",
  },
  {
    slug: "anionico",
    term: "Aniónico",
    aliases: ["aniónica", "aniónicos", "anión"],
    category: "quimica",
    shortDef:
      "Ingrediente con carga eléctrica negativa. Casi todos los que hacen espuma lo son.",
    longDef:
      "Es lo contrario del catiónico: tiene carga negativa. Los tensioactivos que más espuma hacen son aniónicos, y por eso los champús y los jabones se hacen con ellos.\n\nEl problema es que si les pones un catiónico al lado, los dos se atraen, se agarran entre sí y ninguno hace su trabajo.",
    example:
      "El texapón del champú es aniónico. Si le agregas Dehyquart, que es catiónico, el champú limpia peor y acondiciona peor. Para eso existen los policuaternios, que sí conviven con él.",
  },
  {
    slug: "fase-acuosa",
    term: "Fase acuosa",
    aliases: ["fase agua", "parte acuosa"],
    category: "quimica",
    shortDef: "La parte de la receta que es agua y todo lo que se disuelve en agua.",
    longDef:
      "Cuando haces una crema, en realidad estás juntando dos grupos de ingredientes que normalmente no se llevan.\n\nLa fase acuosa es el grupo del agua: el agua destilada, la glicerina, la urea, la niacinamida, los extractos. Todo lo que se disuelve en agua va aquí.\n\nSe prepara aparte, se calienta aparte, y recién al final se junta con la otra.",
    example:
      "En la crema base, la fase acuosa es el agua destilada con el EDTA y la glicerina, calentada a 75 grados.",
  },
  {
    slug: "fase-grasa",
    term: "Fase grasa",
    aliases: ["fase oleosa", "fase aceite", "parte grasa"],
    category: "quimica",
    shortDef: "La parte de la receta que son aceites, mantecas y ceras.",
    longDef:
      "Es el otro grupo de la crema: los aceites, las mantecas, el alcohol cetílico, la vitamina E. Todo lo que no se disuelve en agua.\n\nSe derrite aparte y se calienta a la misma temperatura que la fase acuosa. Que las dos estén a temperatura parecida cuando se juntan es lo que hace que la crema salga bien.\n\nY la fase grasa es lo que hace que una crema de verdad cuide la piel: los humectantes atraen agua, pero si no hay grasa que la selle, esa agua se evapora.",
    example:
      "En la crema base la fase grasa es el alcohol cetílico, la manteca de karité y el escualano, todo derretido junto a 75 grados.",
  },
  {
    slug: "emulsion",
    term: "Emulsión",
    aliases: ["emulsionar", "emulsiona", "emulsionado"],
    category: "quimica",
    shortDef:
      "La mezcla estable de agua y aceite. Una crema es una emulsión.",
    longDef:
      "El agua y el aceite no se mezclan: si los pones juntos y agitas, se separan a los pocos minutos. Una emulsión es cuando logras que se queden mezclados.\n\nEl truco es un ingrediente que actúa de intermediario, el emulsionante, que agarra al agua de un lado y al aceite del otro. Con eso el aceite queda repartido en gotitas microscópicas dentro del agua, y ya no se separa.\n\nCuanto más pequeñas esas gotitas, más estable y más suave queda la crema. Por eso una batidora de inmersión da mejor resultado que una espátula.",
    example:
      "Cuando en la receta dice «batir hasta que emulsione», lo que estás esperando es ese momento en que la mezcla deja de verse aguada y empieza a verse cremosa.",
  },
  {
    slug: "emulsionante",
    term: "Emulsionante",
    aliases: ["emulsionantes"],
    category: "ingrediente",
    shortDef: "El ingrediente que logra que el agua y el aceite se queden mezclados.",
    longDef:
      "Tiene una parte que se lleva con el agua y otra que se lleva con el aceite. Se coloca en la frontera entre los dos y los mantiene unidos.\n\nSin él, una crema se separaría en dos capas a las pocas horas.",
    example: "El Dehyquart es el emulsionante de todas las cremas de LILUS.",
  },
  {
    slug: "tensioactivo",
    term: "Tensioactivo",
    aliases: ["tensioactivos", "surfactante"],
    category: "ingrediente",
    shortDef:
      "El ingrediente que limpia. Agarra la grasa por un lado y el agua por el otro, y se la lleva.",
    longDef:
      "La suciedad de la piel es grasa, y la grasa no se va con agua sola. El tensioactivo tiene una parte que ama el agua y otra que ama la grasa: rodea la grasa, la envuelve, y el agua se lleva todo el paquete.\n\nEs el mismo principio del jabón, del champú y del agua micelar. Lo que cambia entre uno y otro es cuánto lleva y cuál se usa: mucho tensioactivo limpia más pero reseca más.",
    example:
      "En el agua micelar bajamos la betaína del 3 % al 1 % justamente por eso: con 3 % hacía espuma y había que enjuagar, que es lo contrario de lo que se espera de un agua micelar.",
  },
  {
    slug: "micela",
    term: "Micela",
    aliases: ["micelas", "micelar"],
    category: "quimica",
    shortDef:
      "Una bolita microscópica de tensioactivo que atrapa la suciedad por dentro.",
    longDef:
      "Cuando pones tensioactivo en agua, sus moléculas se ordenan solas formando esferas diminutas: la parte que odia el agua queda hacia adentro y la que la ama hacia afuera.\n\nEsas esferas son las micelas. Cuando pasas el algodón, atrapan el maquillaje y la grasa dentro de ellas y se los llevan.\n\nDe ahí viene el nombre «agua micelar».",
  },

  // ═══════════════ TIPOS DE INGREDIENTE ═══════════════
  {
    slug: "humectante",
    term: "Humectante",
    aliases: ["humectantes", "humecta", "humectación"],
    category: "ingrediente",
    shortDef: "Atrae agua hacia la piel y la retiene ahí.",
    longDef:
      "Funciona como una esponja: jala humedad del ambiente y de las capas profundas de la piel, y la mantiene en la superficie.\n\nHay un detalle que conviene saber: un humectante solo, sin nada que lo selle, puede resecar. Atrae el agua a la superficie y de ahí se evapora, llevándose a veces más de la que trajo. Por eso siempre va acompañado de algo graso.",
    example:
      "La glicerina y la urea son humectantes. En la crema humectante van junto a la manteca de karité, que es la que sella.",
  },
  {
    slug: "emoliente",
    term: "Emoliente",
    aliases: ["emolientes"],
    category: "ingrediente",
    shortDef: "Rellena los huequitos entre las células y deja la piel suave al tacto.",
    longDef:
      "La piel seca se siente áspera porque las células de la superficie están levantadas, como tejas mal puestas. El emoliente se mete entre ellas y las acuesta.\n\nEs lo que hace que una crema se sienta rica al aplicarla, más allá de lo que haga a largo plazo.",
    example: "El escualano y el aceite de jojoba son emolientes.",
  },
  {
    slug: "oclusivo",
    term: "Oclusivo",
    aliases: ["oclusivos", "oclusión", "ocluir"],
    category: "ingrediente",
    shortDef: "Forma una película que impide que el agua de la piel se evapore.",
    longDef:
      "Es la tercera pata de una crema. El humectante trae agua, el emoliente suaviza, y el oclusivo pone la tapa para que esa agua no se escape.\n\nSin oclusivo, una crema puede sentirse bien al momento pero no cuidar realmente la piel.",
    example:
      "La manteca de karité y la vaselina son oclusivos. La crema de manos lleva karité porque las manos se lavan diez veces al día y necesitan algo que aguante.",
  },
  {
    slug: "conservante",
    term: "Conservante",
    aliases: ["conservantes", "preservante", "preservantes"],
    category: "ingrediente",
    shortDef:
      "Evita que crezcan bacterias y hongos en los productos que llevan agua.",
    longDef:
      "Donde hay agua, hay vida. Cualquier producto con agua es un ambiente donde las bacterias y los hongos pueden crecer, y no se ven ni se huelen hasta que ya es tarde.\n\nEl conservante no es un extra ni un capricho: es lo que hace que un producto casero se pueda usar durante meses sin riesgo.\n\nLo que sí es importante: cada conservante tiene un porcentaje de uso definido por el fabricante. Menos de eso no protege, y un conservante subdosificado es peor que ninguno, porque da falsa tranquilidad.",
    example:
      "Los jabones de glicerina NO necesitan conservante: tienen poca agua libre y un pH de 10 donde casi nada crece. El agua micelar sí lo necesita, y es el producto más delicado de toda la línea.",
  },
  {
    slug: "quelante",
    term: "Quelante",
    aliases: ["quelantes", "secuestrante", "edta"],
    category: "ingrediente",
    shortDef:
      "Atrapa los restos de metales del agua, que si no arruinan la fórmula.",
    longDef:
      "El agua, los utensilios y hasta las propias materias primas traen restos diminutos de metales como hierro o cobre. Esos restos aceleran que los aceites se pongan rancios y que los activos se degraden.\n\nEl quelante los agarra y los deja fuera de juego. Cuesta muy poco, se usa en cantidades mínimas, y hace que un producto dure bastante más.\n\nEn los champús tiene un bonus: al atrapar los minerales del agua dura, mejora la espuma y evita ese residuo que deja el cabello opaco.",
    example:
      "El EDTA disódico es el quelante que usamos. Va al 0.1 o 0.2 %, que es poquísimo, y aun así se nota.",
  },
  {
    slug: "antioxidante",
    term: "Antioxidante",
    aliases: ["antioxidantes"],
    category: "ingrediente",
    shortDef:
      "Evita que los aceites se pongan rancios al contacto con el aire.",
    longDef:
      "Los aceites reaccionan con el oxígeno del aire y se van echando a perder: cambian de olor, de color y de textura. Eso es enranciarse.\n\nEl antioxidante se sacrifica primero, reaccionando él con el oxígeno para que los aceites no lo hagan. Por eso hay que ponerle una cantidad razonable: si va simbólico, se agota enseguida.",
    example:
      "La vitamina E es el antioxidante de las recetas. En la fórmula original iban 4 gotas en toda una crema, que es casi decorativo; ahora va al 0.3 %.",
  },
  {
    slug: "solubilizante",
    term: "Solubilizante",
    aliases: ["solubilizantes", "solubilizar", "solubiliza"],
    category: "ingrediente",
    shortDef:
      "Permite meter un aceite dentro del agua sin que se separe ni se vea turbio.",
    longDef:
      "Los aceites no se disuelven en agua: quedan flotando. Si a un tónico le echas un aceite esencial sin más, se queda pegado en la pared del frasco o sale concentrado sobre la piel, que es donde puede irritar.\n\nEl solubilizante envuelve cada gotita de aceite en partículas tan pequeñas que la luz las atraviesa y el líquido se ve transparente.\n\nLa forma de usarlo importa: primero se mezcla con el aceite, los dos solos, y recién esa mezcla se agrega al agua. Al revés no funciona.",
    example:
      "El polisorbato 20 del body splash es lo que mantiene la fragancia disuelta. Y es lo que le faltaba al brillo capilar, donde la vitamina E quedaba flotando.",
  },
  {
    slug: "activo",
    term: "Activo",
    aliases: ["activos", "principio activo"],
    category: "ingrediente",
    shortDef:
      "El ingrediente que hace el trabajo que promete el producto.",
    longDef:
      "En una fórmula la mayoría de ingredientes son de soporte: el agua, el emulsionante, el conservante, el aroma. El activo es el que justifica el producto.\n\nY hay una regla que vale la pena tener presente: para que un activo funcione tiene que estar en la cantidad correcta y en un producto donde tenga tiempo de actuar. Un activo excelente en un jabón que se enjuaga en 30 segundos no hace nada.",
    example:
      "La niacinamida al 4 % en la crema despigmentante es un activo. El colágeno en un jabón no llega a serlo: se va por el desagüe antes de poder hacer algo.",
  },
  {
    slug: "sobreengrase",
    term: "Sobreengrase",
    aliases: ["sobreengrasar", "superfat"],
    category: "proceso",
    shortDef:
      "Aceite que se agrega al jabón para que no reseque. No se convierte en jabón: queda libre.",
    longDef:
      "Un jabón limpia arrastrando la grasa, y de paso se lleva también algo de la grasa propia de la piel. Eso es lo que deja esa sensación de tirantez.\n\nEl sobreengrase es agregar un poco de aceite o manteca que se queda sin convertir en jabón. Cuando te enjuagas, ese aceite se deposita y compensa lo que el jabón se llevó.\n\nOjo con pasarse: más del 3 % y el jabón deja de hacer espuma.",
    example:
      "En los jabones LILUS se agregan unos 5 g de manteca de karité por cada 250 g de base. Eso es el sobreengrase.",
  },

  // ═══════════════ PROCESOS ═══════════════
  {
    slug: "bano-maria",
    term: "Baño maría",
    aliases: ["baño de maría"],
    category: "proceso",
    shortDef:
      "Calentar poniendo el recipiente sobre otro con agua hirviendo, en vez de al fuego directo.",
    longDef:
      "El fuego directo calienta de forma desigual: el fondo se quema mientras arriba todavía está frío. El baño maría reparte el calor y nunca pasa de unos 100 grados, que es lo que hierve el agua de abajo.\n\nEs la forma correcta de derretir la base de glicerina, las mantecas y todo lo que se estropea con el calor fuerte.",
  },
  {
    slug: "dilucion-geometrica",
    term: "Dilución geométrica",
    category: "proceso",
    shortDef:
      "Forma de mezclar un líquido en un polvo: primero con una parte pequeña, y esa parte al total.",
    longDef:
      "Si echas unas gotas de aceite sobre un frasco entero de polvo, se forman grumitos húmedos que nunca se reparten bien.\n\nLa dilución geométrica resuelve eso: se aparta una porción pequeña del polvo, se le mezclan los líquidos hasta que quede uniforme, y esa porción se devuelve al total. Así el líquido llega repartido.\n\nEs como se hace en farmacia, y la receta original del talco ya lo hacía bien.",
    example: "El talco para pies se prepara así.",
  },
  {
    slug: "sustantividad",
    term: "Sustantivo",
    aliases: ["sustantividad", "sustantiva", "sustantivos"],
    category: "quimica",
    shortDef:
      "Que se queda pegado a la piel o al cabello aunque enjuagues.",
    longDef:
      "En un producto que se enjuaga, casi todo se va por el desagüe. Los ingredientes sustantivos son la excepción: se adhieren y siguen ahí después.\n\nEs lo que hace que un acondicionador funcione, o que un jabón con sobreengrase no reseque. Y es el criterio para saber si vale la pena poner algo en un producto de enjuague.",
    example:
      "Los catiónicos del acondicionador son sustantivos. El colágeno en un jabón no lo es.",
  },
  {
    slug: "maceracion",
    term: "Maceración",
    aliases: ["macerar", "macerado"],
    category: "proceso",
    shortDef:
      "Dejar reposar una mezcla para que los ingredientes se integren entre sí.",
    longDef:
      "En perfumería, un perfume recién hecho huele distinto al mismo perfume tres semanas después. Las moléculas de la fragancia se acomodan, se integran con el alcohol y el resultado se redondea: pierde el filo del alcohol y gana cuerpo.\n\nSe hace en un lugar oscuro y a temperatura ambiente. El frío lo ralentiza en vez de acelerarlo.",
    example:
      "Los perfumes en alcohol de LILUS reposan 72 horas. Con dos a seis semanas la diferencia se nota bastante más.",
  },
  {
    slug: "sanitizar",
    term: "Sanitizar",
    aliases: ["sanitización", "desinfectar", "sanitizado"],
    category: "seguridad",
    shortDef:
      "Matar los microbios del equipo. No es lo mismo que lavar.",
    longDef:
      "Lavar quita la suciedad visible. Sanitizar mata lo que no se ve.\n\nEl procedimiento completo tiene cuatro pasos: lavar, enjuagar muy bien, rociar con alcohol al 70 %, y dejar secar al aire.\n\nUn dato que sorprende: el alcohol al 70 % desinfecta MEJOR que el de 96 %. El de 96 deshidrata la pared de la bacteria tan rápido que la sella por fuera sin matarla; el agua que lleva el de 70 permite que el alcohol entre.",
  },

  // ═══════════════ MEDIDAS ═══════════════
  {
    slug: "porcentaje",
    term: "Porcentaje",
    aliases: ["%", "por ciento"],
    category: "medida",
    shortDef:
      "Cuánto de un ingrediente hay respecto al peso total del producto.",
    longDef:
      "Cuando una receta dice «conservante al 0.5 %», significa medio gramo por cada 100 gramos de producto terminado.\n\nEs la forma correcta de dosificar todo lo que tiene un límite: conservantes, activos, aceites esenciales. Una cucharadita o unas gotas dependen del gotero y de la densidad; un porcentaje no depende de nada.\n\nPara calcularlo: peso total × porcentaje ÷ 100.",
    example:
      "Para 250 g de agua micelar con conservante al 0.75 %: 250 × 0.75 ÷ 100 = 1.9 g.",
  },
  {
    slug: "gotas",
    term: "Gotas",
    aliases: ["gota"],
    category: "medida",
    shortDef:
      "Medida imprecisa: el tamaño depende del gotero y de qué tan espeso sea el líquido.",
    longDef:
      "Una gota de agua pesa alrededor de 0.05 gramos. Una gota de un aceite espeso puede pesar la mitad. Y un gotero ancho da gotas bastante más grandes que uno fino.\n\nPara aromas y colorantes las gotas están bien, porque un poco más o un poco menos no cambia nada importante. Para conservantes y activos conviene pesar.\n\nUn truco útil: contar cuántas gotas hacen 1 gramo con cada gotero, anotarlo, y ya tienes tu propia tabla de conversión.",
  },

  // ═══════════════ SEGURIDAD ═══════════════
  {
    slug: "fotosensibilizante",
    term: "Fotosensibilizante",
    aliases: ["fotosensibilidad", "fototóxico", "fotosensible"],
    category: "seguridad",
    shortDef:
      "Ingrediente que, con sol, puede provocar manchas o quemaduras en la piel.",
    longDef:
      "Algunas sustancias son inofensivas en la sombra pero reaccionan con la luz del sol una vez que están sobre la piel. El resultado pueden ser manchas oscuras que tardan meses en irse, o quemaduras.\n\nLas cáscaras de cítricos son el caso más conocido. Por eso los productos con cítricos que se quedan puestos se usan de noche.\n\nEn un producto que se enjuaga el riesgo es bajo, porque no se queda.",
    example:
      "El glicerado de cítricos se puede aplicar en el rostro solo de noche. En el jabón no hay problema, porque se enjuaga.",
  },
  {
    slug: "sensibilizante",
    term: "Sensibilizante",
    aliases: ["sensibilización", "alérgeno", "alergeno"],
    category: "seguridad",
    shortDef:
      "Ingrediente que puede provocar alergia con el uso repetido.",
    longDef:
      "Es distinto de un irritante. Un irritante molesta desde la primera vez y a todo el mundo. Un sensibilizante puede no dar problema durante meses, hasta que el cuerpo lo reconoce como enemigo y a partir de ahí reacciona siempre.\n\nLo delicado es que una vez que pasa, ya no hay vuelta atrás: esa persona va a reaccionar a ese ingrediente para siempre.\n\nLas fragancias son la causa más frecuente de alergia de contacto en cosmética. Por eso en productos para niños o para piel sensible conviene bajarlas o quitarlas.",
    example:
      "La canela del jabón de café es un sensibilizante conocido. Por eso ese jabón no se recomienda para piel sensible ni para niños.",
  },
  {
    slug: "leave-on",
    term: "Se queda en la piel",
    aliases: ["leave-on", "leave on", "no se enjuaga"],
    category: "seguridad",
    shortDef:
      "Producto que se aplica y se deja puesto, como una crema.",
    longDef:
      "La diferencia con un producto que se enjuaga cambia todo.\n\nLo que se queda puesto tiene horas para actuar, así que los activos sí funcionan. Pero por lo mismo, cualquier ingrediente problemático también tiene horas para hacer efecto, y la exigencia de seguridad es mayor.\n\nLo que se enjuaga está en la piel 30 segundos: los activos casi no alcanzan a hacer nada, pero también hay más margen con los ingredientes.",
    example:
      "El agua micelar se queda en la piel. Por eso ahí preferimos un conservante con mejor perfil que el que usamos en los jabones.",
  },
  {
    slug: "rinse-off",
    term: "Se enjuaga",
    aliases: ["rinse-off", "rinse off", "de enjuague"],
    category: "seguridad",
    shortDef:
      "Producto que se aplica y se retira con agua, como un jabón o un champú.",
    longDef:
      "El contacto con la piel dura entre 20 y 60 segundos. En ese tiempo casi ningún activo alcanza a penetrar, así que lo que funciona son los ingredientes que actúan por contacto —arcillas, exfoliantes, absorbentes— o los que se quedan pegados después del enjuague.\n\nEs la razón por la que se sacaron el colágeno, la elastina y los ácidos de los jabones: no era que fueran malos, es que ahí no podían hacer nada.",
  },

  // ═══════════════ INGREDIENTES QUE CONFUNDEN ═══════════════
  {
    slug: "inci",
    term: "INCI",
    aliases: ["nombre inci"],
    category: "medida",
    shortDef:
      "El nombre científico estandarizado de un ingrediente, igual en todo el mundo.",
    longDef:
      "Cada ingrediente cosmético tiene tres nombres distintos, y confundirlos causa problemas.\n\nEl nombre comercial es como lo llama la marca que lo fabrica: «Kemidant L». El fabricante es la empresa: «Akema». Y el INCI es el nombre de la sustancia en sí: «DMDM Hydantoin».\n\nEl INCI es el que sirve para comparar entre proveedores, para leer una etiqueta de supermercado y para saber qué estás comprando de verdad. Pedir por nombre comercial tiene un riesgo: si la marca cambia la fórmula, tú no te enteras.",
    example:
      "En las etiquetas de cualquier cosmético del supermercado, la lista de ingredientes está en INCI y ordenada de mayor a menor cantidad.",
  },
  {
    slug: "ficha-tecnica",
    term: "Ficha técnica",
    aliases: ["fichas técnicas", "hoja técnica", "tds"],
    category: "medida",
    shortDef:
      "El documento del fabricante con los datos de uso de un ingrediente.",
    longDef:
      "Es gratis y te la tienen que dar. Contiene lo que necesitas para usar bien un ingrediente: a qué porcentaje va, en qué rango de pH funciona, hasta qué temperatura aguanta, en qué se disuelve, y con qué no se lleva.\n\nSin ella estás formulando a ciegas: es la diferencia entre saber que el conservante va al 0.3 % y ponerle «unas gotas».",
    example:
      "La ficha del Kemidant dice: dosis 0.2 a 0.5 %, pH 3 a 9, hasta 80 grados. Con esos tres datos ya se puede usar bien.",
  },
  {
    slug: "arcilla",
    term: "Arcilla",
    aliases: ["arcillas", "caolín", "bentonita", "rhassoul"],
    category: "ingrediente",
    shortDef:
      "Polvo mineral que absorbe grasa por contacto y da color natural.",
    longDef:
      "Las arcillas funcionan sin necesidad de penetrar: absorben la grasa de la superficie mientras están en contacto con la piel. Por eso sí sirven en un jabón, a diferencia de casi todos los activos.\n\nY tienen un bonus: dan color. Cambiar un colorante sintético por una arcilla es ganar dos veces, porque el color viene con función incluida y permite decir «sin colorantes artificiales».\n\nLa blanca (caolín) es la más suave. La verde y la bentonita absorben más, para piel grasa. La rosa es intermedia y deja tacto sedoso.",
    example:
      "El jabón de rosas usa arcilla rosa en vez de colorante rosado: da el mismo color y además limpia suavemente.",
  },
  {
    slug: "bloqueador-humedad-termino",
    term: "Bloqueador de humedad",
    category: "ingrediente",
    shortDef:
      "Aditivo que se agrega a los jabones de glicerina para que no suden.",
    longDef:
      "El jabón de glicerina «suda»: le aparecen gotitas en la superficie. Pasa porque la glicerina atrae agua del aire, y en ambiente húmedo lo hace con ganas.\n\nEl bloqueador ayuda, pero conviene saber que lo que más funciona contra el sudor no es un aditivo: es envolver el jabón en film apenas se desmolda, y trabajar en días secos.",
    example:
      "El jabón de avena y miel es el que más suda, porque la miel es azúcar y también atrae humedad. Ese hay que envolverlo de inmediato.",
  },
  {
    slug: "avena-coloidal-termino",
    term: "Avena coloidal",
    category: "ingrediente",
    shortDef:
      "Avena molida ultrafina, reconocida como protector de la piel. No es lo mismo que avena molida común.",
    longDef:
      "La diferencia entre la avena molida de la cocina y la coloidal no es solo el tamaño del grano.\n\nLa avena molida común exfolia y nada más. La coloidal está procesada de forma que sus componentes quedan disponibles, y tiene efecto calmante y contra el picor comprobado. Está reconocida como protector cutáneo.\n\nY es de los poquísimos ingredientes con respaldo serio que siguen funcionando aunque el producto se enjuague.",
    example:
      "El jabón de niños lleva avena coloidal. Es donde más sentido tiene de toda la línea LILUS.",
  },
];
