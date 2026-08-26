/**
 * Reescribe el texto de ingredientes de cada producto para que cumpla la
 * Decisión 516 de la Comunidad Andina.
 *
 *   npx tsx scripts/textos-cumplimiento.ts          # muestra los cambios
 *   npx tsx scripts/textos-cumplimiento.ts --aplicar # los guarda
 *
 * ── Por qué ──
 *
 * Un cosmético no puede decir que cura, y la norma no distingue entre la
 * publicidad y el etiquetado: aplica a los dos.
 *
 * Hoy este campo no se muestra en ninguna parte. El esquema dice que va en
 * la etiqueta 2×1, pero esa etiqueta imprime lote, SKU y fechas — el texto
 * nunca llegó a usarse. O sea que los claims que había todavía no habían
 * salido impresos en nada: se corrigen antes de que la web los publique,
 * que es justo cuando pasarían a ser un problema de verdad.
 *
 * Lo que se saca, y por qué:
 *
 *   «cicatrizante», «regeneradora»  → vocabulario médico
 *   «aclarante», «blanqueadora»     → despigmentante, claim terapéutico
 *   «desintoxicante»                → promete un efecto que no es cosmético
 *   «antibacteriano»                → restricción específica de jabones
 *   «natural»                       → no es verificable
 *
 * Lo que entra en su lugar sale de la tabla de
 * LILUS-AUDIOVISUAL/05-claims/lo-que-no-se-puede-decir.md: «ayuda a»,
 * «sensación de», «deja la piel suave al tacto», «para pieles grasas».
 * Describe lo mismo, se puede sostener, y además es mejor texto de venta.
 *
 * ── De paso ──
 *
 * Los ingredientes que se nombran ahora son los que están de verdad en la
 * receta. El jabón de naranja decía «vitamina C» y en la fórmula no hay
 * vitamina C: decía algo que no era cierto.
 *
 * Los ProductionUnit ya creados guardan su propia copia del texto y no se
 * tocan: la etiqueta de un pedido viejo debe seguir diciendo lo que decía.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** SKU → texto nuevo. Corto: esto entra en una etiqueta de 2×1 pulgadas. */
const TEXTOS: Record<string, string> = {
  // ── Jabones ──
  "LIL-JAB-ARR":
    "Polvo de arroz, leche de coco, aceite de rosa mosqueta. Ayuda a unificar el tono y deja la piel suave.",
  "LIL-JAB-CUR":
    "Polvo y aceite de cúrcuma, caolín, manteca de karité. Aporta luminosidad al tono de la piel.",
  "LIL-JAB-CAR":
    "Carbón activado, arcillas bentonita y verde, árbol de té. Para pieles grasas. Limpia en profundidad.",
  "LIL-JAB-CAF":
    "Café granulado, canela, manteca de karité, aceite de almendra. Exfolia suavemente.",
  "LIL-JAB-NAR":
    "Glicerado y polvo de naranja, aceite esencial de naranja dulce. Aroma cítrico, sensación de frescura.",
  "LIL-JAB-ROM":
    "Aceite esencial y polvo de romero, manteca de karité. Para la higiene diaria de pieles grasas.",
  "LIL-JAB-LAV":
    "Aceite esencial de lavanda y gránulos de frutilla. Aroma a lavanda, exfolia suavemente.",
  "LIL-JAB-ROS":
    "Arcilla rosa, geranio, palmarosa, aceite de rosa mosqueta. Deja la piel suave al tacto.",
  "LIL-JAB-SAB":
    "Aloe vera 200:1, aceite de sábila, romero, árbol de té. Ayuda a mantener la piel hidratada.",
  "LIL-JAB-ALU":
    "Polvo de piedra de alumbre, árbol de té, aceite de almendra. Para axilas y pies. Controla el olor.",
  "LIL-JAB-PEP":
    "Polvo de pepino, arcilla verde, mentol, menta. Aporta sensación de frescura.",
  "LIL-JAB-COC":
    "Aceite de coco virgen sobre base de glicerina. Deja la piel suave al tacto.",
  "LIL-JAB-MAR":
    "Aroma de maracuyá sobre base de glicerina. Aroma frutal, sensación de frescura.",
  "LIL-JAB-MMA":
    "Extracto y flores de manzanilla, caléndula, miel de abejas, karité. Para pieles sensibles.",

  // ── Extras ──
  "LIL-EXT-AMI":
    "Pantenol, alantoína, extracto de té verde, betaína de coco. Limpia el rostro y retira el maquillaje.",
  "LIL-EXT-CCN":
    "Crema con concha de nácar. Ayuda a mantener la piel suave e hidratada.",
  "LIL-EXT-CRB":
    "Niacinamida 4 %, rosa mosqueta, vitamina E, óxido de zinc. Ayuda a unificar el tono de la piel.",
  "LIL-EXT-SHA":
    "Romero, cafeína, queratina, biotina, pantenol. Limpia el cabello y aporta cuerpo.",
  "LIL-EXT-ACO":
    "Alcohol cetílico, pantenol, queratina, proteínas hidrolizadas. Desenreda y suaviza el cabello.",
  "LIL-EXT-PAC":
    "Fragancia sobre base de aceite, con fijador. El aroma dura más que en base alcohol.",
  "LIL-EXT-PVA":
    "Fragancia sobre base de vaselina y glicerina, con fijador. Formato sólido, práctico para viajar.",
};

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const productos = await prisma.product.findMany({ orderBy: { sku: "asc" } });

  let cambios = 0;
  let sinTexto = 0;

  for (const p of productos) {
    const nuevo = TEXTOS[p.sku];
    if (!nuevo) {
      console.log(`?  ${p.sku} — sin texto definido, se deja como está`);
      sinTexto++;
      continue;
    }
    if (p.ingredients === nuevo) continue;

    cambios++;
    console.log(`\n${p.sku}  ${p.name}`);
    console.log(`   antes:  ${p.ingredients ?? "(vacío)"}`);
    console.log(`   ahora:  ${nuevo}`);

    if (aplicar) {
      await prisma.product.update({
        where: { id: p.id },
        data: { ingredients: nuevo },
      });
    }
  }

  console.log(
    `\n${cambios} producto(s) a cambiar` +
      (sinTexto ? `, ${sinTexto} sin texto definido` : "")
  );
  console.log(
    aplicar
      ? "Guardado."
      : "Nada guardado todavía. Corre con --aplicar para escribirlo."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
