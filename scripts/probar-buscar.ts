/**
 * Comprueba el buscador de la tienda con los textos reales del catálogo.
 *
 * Un buscador que se equivoca no falla: devuelve una lista plausible sin
 * lo que se pedía, y quien la mira concluye que no lo venden.
 */
import { filtrar, coincide, terminos, porQueCoincide } from "../src/lib/buscar";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? "ok  " : "FALLA"} ${que}` +
      (ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`)
  );
}

/* Textos copiados de la base de producción, sin retocar. */
const catalogo = [
  {
    nombre: "Jabón de Arroz",
    tagline: "Ayuda a unificar el tono y deja la piel suave",
    ingredientes:
      "Polvo de arroz, leche de coco, aceite de rosa mosqueta. Ayuda a unificar el tono y deja la piel suave.",
  },
  {
    nombre: "Jabón de Cúrcuma",
    tagline: "Aporta luminosidad al tono de la piel",
    ingredientes:
      "Polvo y aceite de cúrcuma, caolín, manteca de karité. Aporta luminosidad al tono de la piel.",
  },
  {
    nombre: "Jabón de Carbón Activado",
    tagline: "Para pieles grasas. Limpia en profundidad",
    ingredientes:
      "Carbón activado, arcillas bentonita y verde, árbol de té. Para pieles grasas. Limpia en profundidad.",
  },
  {
    nombre: "Jabón de Café",
    tagline: "Exfolia suavemente, con café y canela",
    ingredientes:
      "Café granulado, canela, manteca de karité, aceite de almendra. Exfolia suavemente.",
  },
  {
    nombre: "Jabón de Coco",
    tagline: "Deja la piel suave al tacto",
    ingredientes:
      "Aceite de coco virgen sobre base de glicerina. Deja la piel suave al tacto.",
  },
  {
    nombre: "Shampoo Sólido de Romero",
    tagline: "Refresca el cuero cabelludo",
    ingredientes:
      "Romero, ortiga, aceite de ricino. Refresca el cuero cabelludo.",
  },
  {
    nombre: "Jabón de Manzanilla",
    tagline: "Para pieles sensibles",
    ingredientes: "Manzanilla, avena coloidal, romero. Para pieles sensibles.",
  },
  {
    nombre: "Pack Serenidad y Calma",
    tagline: "Tres jabones para bajar el ritmo",
    // Compuesto de lo que lleva dentro, como hace la tienda.
    ingredientes:
      "Jabón de Manzanilla: Manzanilla, avena coloidal, romero. Jabón de Coco: Aceite de coco virgen sobre base de glicerina.",
  },
];

const nombres = (q: string) => filtrar(catalogo, q).map((a) => a.nombre);

console.log("── lo de siempre sigue funcionando ──");
igual("por nombre exacto", nombres("carbón"), ["Jabón de Carbón Activado"]);
igual("sin la tilde", nombres("carbon"), ["Jabón de Carbón Activado"]);
igual(
  "dos palabras acotan",
  nombres("jabon cafe"),
  ["Jabón de Café"]
);
igual("lo que no está", nombres("chocolate"), []);

console.log("\n── ahora también por lo que lleva ──");
{
  const r = nombres("romero");
  igual("«romero» trae los tres que lo llevan", r.length, 3);
  igual("...y el que se llama así va primero", r[0], "Shampoo Sólido de Romero");
  igual(
    "...los otros dos también salen",
    r.slice(1).sort(),
    ["Jabón de Manzanilla", "Pack Serenidad y Calma"]
  );
}
igual(
  "«avena» encuentra el jabón que no la lleva en el nombre",
  nombres("avena").sort(),
  ["Jabón de Manzanilla", "Pack Serenidad y Calma"]
);
igual(
  "«karité» encuentra los dos que la llevan",
  nombres("karite").sort(),
  ["Jabón de Café", "Jabón de Cúrcuma"]
);
igual(
  "«bentonita» encuentra el único que la lleva",
  nombres("bentonita"),
  ["Jabón de Carbón Activado"]
);
igual(
  "un pack sale por lo que lleva dentro",
  nombres("glicerina").sort(),
  ["Jabón de Coco", "Pack Serenidad y Calma"]
);

console.log("\n── el nombre sigue mandando en el orden ──");
{
  const r = nombres("coco");
  igual("«coco» pone primero el jabón de coco", r[0], "Jabón de Coco");
  igual(
    "...y detrás los que lo llevan de ingrediente",
    r.includes("Jabón de Arroz"),
    true
  );
}

console.log("\n── las palabras cortas no meten ruido ──");
/*
  Una palabra corta sí busca en el NOMBRE —«de» encuentra «Jabón de
  Arroz», y está bien: se está tecleando— pero no puede colarse por los
  textos, que es donde «de» y «la» aparecen en todos los artículos.

  El pack lo prueba: su nombre no lleva «de» por ningún lado, y su
  resumen de ingredientes sí («Aceite de coco»). Si saliera, el mínimo de
  letras no estaría haciendo su trabajo.
*/
igual(
  "«de» encuentra los que lo llevan en el nombre",
  nombres("de").every((n) => n.toLowerCase().includes("de")),
  true
);
igual(
  "...y NO el pack, que solo lo lleva en los ingredientes",
  nombres("de").includes("Pack Serenidad y Calma"),
  false
);
igual(
  "«jabon la» solo trae el que lleva «la» en el nombre",
  nombres("jabon la"),
  ["Jabón de Manzanilla"]
);

console.log("\n── por qué salió cada uno ──");
igual(
  "si coincide el nombre, no hace falta explicar nada",
  porQueCoincide(catalogo[5], "romero"),
  null
);
igual(
  "si coincide solo el ingrediente, se dice cuál",
  porQueCoincide(catalogo[6], "romero"),
  "Manzanilla, avena coloidal, romero."
);
igual(
  "se devuelve la frase con la palabra, no el resumen entero",
  porQueCoincide(catalogo[2], "bentonita"),
  "Carbón activado, arcillas bentonita y verde, árbol de té."
);
igual(
  "sin consulta no hay nada que explicar",
  porQueCoincide(catalogo[6], ""),
  null
);
igual(
  "un artículo sin resumen no inventa explicación",
  porQueCoincide({ nombre: "Algo", tagline: "avena" }, "avena"),
  null
);

console.log("\n── casos que no deberían romper ──");
igual("consulta vacía devuelve todo", filtrar(catalogo, "").length, catalogo.length);
igual("solo espacios devuelve todo", filtrar(catalogo, "   ").length, catalogo.length);
igual("no hay términos con espacios", terminos("   "), []);
igual(
  "coincide sin agujas es cierto",
  coincide({ nombre: "X" }, []),
  true
);
igual(
  "un artículo sin tagline ni ingredientes no rompe",
  coincide({ nombre: "Jabón de Miel" }, ["miel"]),
  true
);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
