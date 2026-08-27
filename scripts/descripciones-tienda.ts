/**
 * El texto largo que se lee en la página de cada producto.
 *
 *   npx tsx scripts/descripciones-tienda.ts           # muestra lo que haría
 *   npx tsx scripts/descripciones-tienda.ts --aplicar # lo guarda
 *
 * ── Qué es este campo y qué no ──
 *
 * `tagline` es la línea del catálogo: se lee de reojo, entre otras doce.
 * `ingredients` es lo que cabe en una etiqueta de 2×1 pulgadas.
 * `description` —esto— es lo único que se lee con calma, cuando alguien
 * ya entró a la página porque le interesó. Es el sitio donde se puede
 * contar de qué está hecho y a qué se parece usarlo.
 *
 * ── Cómo están escritos ──
 *
 * Los ingredientes que se nombran son los de la fórmula real, los mismos
 * que están en `scripts/textos-cumplimiento.ts`. Nada de adornar con algo
 * que no está adentro: el jabón de naranja decía «vitamina C» y en la
 * receta no hay vitamina C.
 *
 * Y nada promete curar, tratar ni corregir. La Decisión 516 de la CAN
 * aplica igual a la publicidad que al etiquetado, y una tienda pública es
 * publicidad. Se describe lo que se siente y lo que hay dentro: «deja la
 * piel suave al tacto», «para pieles grasas», «ayuda a». Fuera quedan
 * «cicatrizante», «antibacteriano», «aclarante», «desintoxicante» y
 * «natural» — esta última porque no es verificable.
 *
 * No es solo cumplir la norma: describir una sensación vende mejor que
 * prometer un efecto que nadie puede comprobar.
 *
 * ── Sobre el largo ──
 *
 * Tres párrafos cortos. Se leen en el teléfono, con el pulgar. Lo que se
 * cuenta primero es a qué se parece usarlo; los ingredientes van después,
 * porque quien llegó hasta ahí ya quiere el detalle.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESCRIPCIONES: Record<string, string> = {
  // ─────────────────────── Jabones ───────────────────────

  "LIL-JAB-ARR": `Un jabón blanco, sin aroma fuerte, de los que no se notan y se extrañan cuando se acaban. La espuma sale densa y cremosa por la leche de coco, y el polvo de arroz deja una textura finísima que se siente al enjuagar.

Lleva polvo de arroz, leche de coco y aceite de rosa mosqueta. El arroz se usa desde hace siglos en el cuidado de la piel del rostro, y la rosa mosqueta aporta la parte grasa que evita que un jabón deje tirante.

Ayuda a unificar el tono y deja la piel suave. Va bien en la cara y en el cuerpo, todos los días.`,

  "LIL-JAB-CUR": `Amarillo intenso, del color que solo da la cúrcuma de verdad. Huele a especia tibia, no a perfume. Si lo dejas en una jabonera clara puede teñirla un poco: es la misma raíz que tiñe el arroz.

Lleva polvo y aceite de cúrcuma, caolín y manteca de karité. El caolín es una arcilla blanca muy suave que limpia sin raspar, y el karité compensa para que la piel no quede seca.

Aporta luminosidad al tono de la piel. Para el rostro, empieza dos o tres veces por semana y ve viendo cómo te cae.`,

  "LIL-JAB-CAR": `Negro, mate, de los que se ven serios en el borde del lavamanos. Hace una espuma gris que se aclara al enjuagar. La sensación al terminar es de piel limpia de verdad, no de piel apretada.

Lleva carbón activado, arcillas bentonita y verde, y aceite esencial de árbol de té. Las dos arcillas son las que hacen el trabajo con la grasa; el árbol de té le da ese fondo herbal, casi medicinal, que se reconoce enseguida.

Para pieles grasas. Limpia en profundidad. Si tienes la piel seca, mejor déjalo para el cuerpo o alterna con el de coco.`,

  "LIL-JAB-CAF": `Se nota apenas lo agarras: los gránulos de café se sienten en la mano antes de mojarlo. Huele a café con canela, y ese olor se queda un rato en las manos después de usarlo.

Lleva café granulado, canela, manteca de karité y aceite de almendra. El café va molido grueso para que exfolie de verdad pero sin lastimar; el karité y la almendra están ahí para que después no quede la piel áspera.

Exfolia suavemente. Es el que la gente usa en la ducha, de pie, frotando en círculos sobre codos y rodillas. Dos o tres veces por semana basta.`,

  "LIL-JAB-NAR": `Naranja translúcido, de los que dejan pasar la luz. Huele a cáscara recién rallada — no al caramelo de naranja, a la cáscara. Es de los que más gustan a quien se baña en la mañana.

Lleva glicerado y polvo de naranja con aceite esencial de naranja dulce. La base de glicerina es la que le da esa transparencia y una espuma ligera, menos densa que la de los jabones opacos.

Aroma cítrico y sensación de frescura. Sirve igual para las manos que para el cuerpo.`,

  "LIL-JAB-ROM": `Verde oscuro con puntitos, y un olor herbal seco que no se parece a nada floral. Es un jabón que despierta, de los que van bien a primera hora.

Lleva aceite esencial y polvo de romero sobre manteca de karité. El romero molido hace de exfoliante muy fino, casi imperceptible, y el karité evita que la limpieza se pase de eficiente.

Para la higiene diaria de pieles grasas. También funciona bien en el cuero cabelludo si te gusta lavarte el pelo con jabón sólido.`,

  "LIL-JAB-LAV": `Morado suave, con gránulos rojos de frutilla repartidos. El aroma a lavanda es el que la gente pide más: es el jabón de la noche, el del baño largo antes de dormir.

Lleva aceite esencial de lavanda y gránulos de frutilla. Los gránulos son pequeños y no raspan; están para que la barra haga algo más que oler bien.

Aroma a lavanda, exfolia suavemente. Es el que solemos recomendar para regalar cuando no se sabe qué le gusta a la otra persona: la lavanda casi nunca falla.`,

  "LIL-JAB-ROS": `Rosa pálido, del color de la arcilla, no de un colorante. Huele a rosa de verdad, con un fondo verde del geranio que le quita lo dulce.

Lleva arcilla rosa, geranio, palmarosa y aceite de rosa mosqueta. La arcilla rosa es la más delicada de todas, la que se usa en pieles que se irritan con cualquier cosa; la rosa mosqueta pone la parte nutritiva.

Deja la piel suave al tacto. Es el más suave de la línea, el que va bien cuando ningún otro cae bien.`,

  "LIL-JAB-SAB": `Verde traslúcido, resbaladizo de una manera distinta a los demás — es la sábila. La espuma sale ligera y se enjuaga rápido, sin dejar película.

Lleva aloe vera concentrado 200:1, aceite de sábila, romero y árbol de té. Ese 200:1 quiere decir que el aloe va concentrado doscientas veces; es la diferencia entre que la sábila esté en la fórmula y que se note.

Ayuda a mantener la piel hidratada. Es el que la gente busca después de un día de sol.`,

  "LIL-JAB-ALU": `Un jabón blanco grisáceo, sin aroma dulce, con un fondo limpio de árbol de té. No es un jabón bonito: es un jabón que resuelve algo.

Lleva polvo de piedra de alumbre, aceite esencial de árbol de té y aceite de almendra. La piedra de alumbre se usa en Ecuador desde siempre para lo mismo, y aquí va molida dentro de la barra en vez de aparte.

Para axilas y pies. Controla el olor. Se usa en la ducha, dejándolo actuar un momento antes de enjuagar.`,

  "LIL-JAB-PEP": `Verde claro, y frío. Frío de verdad: el mentol se siente en la piel unos segundos después de enjuagar, sobre todo en las piernas.

Lleva polvo de pepino, arcilla verde, mentol y menta. La arcilla verde es la más absorbente de las que usamos, y el pepino suaviza lo que la arcilla podría dejar áspero.

Aporta sensación de frescura. Es el jabón de los días de calor y de las piernas cansadas al final de la jornada.`,

  "LIL-JAB-COC": `Transparente, sencillo, con olor a coco discreto. Es el jabón sin complicaciones de la línea: el que sirve para todo y no molesta a nadie.

Lleva aceite de coco virgen sobre base de glicerina. El coco virgen es el que se prensa sin calor y conserva su olor propio; por eso huele a coco de verdad y no a bronceador.

Deja la piel suave al tacto. Es el que recomendamos cuando alguien tiene la piel seca y no sabe por cuál empezar.`,

  "LIL-JAB-MAR": `Amarillo anaranjado y traslúcido, con el aroma más goloso de toda la línea. El maracuyá es de esos olores que te llevan a otro lado sin pedirte permiso.

Lleva aroma de maracuyá sobre base de glicerina. La base glicerinada hace una espuma ligera y se enjuaga sin dejar residuo, que es lo que se busca en un jabón de aroma fuerte.

Aroma frutal y sensación de frescura. Es de los que más se venden en verano y de los que más se regalan.`,

  "LIL-JAB-MMA": `Color miel, con florecitas de manzanilla visibles dentro de la barra. Huele a infusión, a algo tibio. Es de los más pesados de la línea — cien gramos que se sienten en la mano.

Lleva extracto y flores de manzanilla, caléndula, miel de abejas y manteca de karité. La manzanilla y la caléndula son las dos plantas de siempre para lo que se irrita fácil, y la miel aporta la parte que deja la piel cómoda después de lavar.

Para pieles sensibles. Es el que damos a quien nos dice que ningún jabón le va bien.`,

  // ─────────────────────── Extras ───────────────────────

  "LIL-EXT-AMI": `Un agua transparente, sin espuma y sin aroma. Se pone en un algodón, se pasa por la cara y arrastra el maquillaje sin que haya que frotar. No necesita enjuague.

Lleva pantenol, alantoína, extracto de té verde y betaína de coco. La betaína de coco es el limpiador suave que hace el trabajo; el pantenol y la alantoína están para que la piel no quede tirante después.

Limpia el rostro y retira el maquillaje. Es el primer paso de la noche, antes del jabón si te desmaquillas doble.`,

  "LIL-EXT-CCN": `Una crema blanca, densa, de las que se absorben despacio. Se pone poca cantidad y se extiende: si queda pegajosa es que fue demasiada.

Lleva concha de nácar, un ingrediente que en la costa ecuatoriana se usa en cosmética desde hace generaciones. La textura es de crema de noche, más rica que una loción corporal.

Ayuda a mantener la piel suave e hidratada. Se usa en el rostro y también en manos y codos, que es donde más se nota.`,

  "LIL-EXT-CRB": `Una crema ligera para rostro y cuerpo, de las que se ponen en la noche y se dejan trabajar mientras duermes.

Lleva niacinamida al 4 %, aceite de rosa mosqueta, vitamina E y óxido de zinc. La niacinamida es de los pocos ingredientes cosméticos con estudios serios detrás, y el 4 % es una concentración de trabajo, no simbólica.

Ayuda a unificar el tono de la piel. Como toda rutina de tono, pide constancia: se usa un tiempo seguido y se acompaña de protector solar en el día, porque sin eso el sol deshace lo andado.`,

  "LIL-EXT-SHA": `Un shampoo artesanal de línea herbal. Hace menos espuma que los industriales — eso es normal y no significa que limpie menos; los sulfatos que hacen mucha espuma no son los que hacen el trabajo.

Lleva romero, cafeína, queratina, biotina y pantenol. El romero y la cafeína son la parte herbal que le da carácter; la queratina y el pantenol se ocupan de que el cabello quede con cuerpo y no áspero.

Limpia el cabello y aporta cuerpo. Va con el acondicionador de la misma línea.`,

  "LIL-EXT-ACO": `Un acondicionador espeso, de los que se sienten al enjuagar. Se pone de medios a puntas, se deja un par de minutos y se retira con agua fría si puedes aguantarla.

Lleva alcohol cetílico, pantenol, queratina y proteínas hidrolizadas. El alcohol cetílico no es el alcohol que reseca: es un graso, y es lo que hace que un acondicionador sea cremoso.

Desenreda y suaviza el cabello. Está pensado para ir después del shampoo artesanal, que al hacer menos espuma deja el pelo más receptivo.`,

  "LIL-EXT-PAC": `Perfume en base aceite, en frasco pequeño con rollon. Se pone en las muñecas y detrás de las orejas, donde la piel está más tibia.

El aroma dura más que en base alcohol. La razón es simple: el alcohol se evapora y se lleva la fragancia con él; el aceite se queda en la piel y la va soltando de a poco. A cambio, el aroma se proyecta menos — es un perfume de cerca, no de entrada triunfal.

Notas cítricas y herbales, sobre base de aceite con fijador.`,

  "LIL-EXT-PVA": `Perfume sólido, en base de vaselina y glicerina. Se pasa el dedo por la superficie y se aplica donde quieras: no se derrama, no se rompe y pasa por cualquier control de aeropuerto.

Formato sólido, práctico para viajar. Es el que va en la cartera, en la mochila, en el bolsillo del asiento del carro. Sale más o menos donde lo pongas y ahí se queda.

Fragancia sobre base vaselinada, con fijador.`,
};

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const productos = await prisma.product.findMany({ orderBy: { sku: "asc" } });

  let cambios = 0;
  let sinTexto = 0;

  for (const p of productos) {
    const nueva = DESCRIPCIONES[p.sku];
    if (!nueva) {
      console.log(`?  ${p.sku} — sin descripción definida, se deja como está`);
      sinTexto++;
      continue;
    }
    if (p.description === nueva) continue;

    cambios++;
    const palabras = nueva.split(/\s+/).length;
    console.log(
      `\n${p.sku}  ${p.name}` +
        `\n   ${p.description ? "reemplaza el texto anterior" : "estaba vacío"} · ${palabras} palabras` +
        `\n   «${nueva.split("\n")[0].slice(0, 72)}…»`
    );

    if (aplicar) {
      await prisma.product.update({
        where: { id: p.id },
        data: { description: nueva },
      });
    }
  }

  console.log(`\n${cambios} descripción(es) a escribir.`);
  if (sinTexto > 0) console.log(`${sinTexto} producto(s) sin texto definido.`);
  if (!aplicar) {
    console.log("Nada guardado todavía. Corre con --aplicar para escribirlo.");
  } else {
    console.log("Guardado.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
