/** Comprueba la lectura del número de guía desde un código escaneado. */
import { numeroDeGuia } from "../src/lib/leer-guia";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${que}${ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`}`);
}

console.log("── el número pelado (código de barras) ──");
igual("tal cual", numeroDeGuia("1234567890"), "1234567890");
igual("con espacios", numeroDeGuia(" 1234567890 "), "1234567890");
igual("con guiones", numeroDeGuia("123-456-7890"), "1234567890");
igual("catorce dígitos", numeroDeGuia("21212121212122"), "21212121212122");

console.log("\n── dentro de una dirección web (QR) ──");
igual(
  "con ?guia=",
  numeroDeGuia("https://www.servientrega.com.ec/rastreo?guia=1234567890"),
  "1234567890"
);
igual(
  "con &numero=",
  numeroDeGuia("https://rastreo.example.com/x?a=1&numero=1234567890&b=2"),
  "1234567890"
);
igual(
  "con tracking=",
  numeroDeGuia("https://example.com/track?tracking=987654321012"),
  "987654321012"
);

console.log("\n── dentro de un texto con campos ──");
igual("GUIA:", numeroDeGuia("GUIA:1234567890;PESO:2.5;DEST:QUITO"), "1234567890");
igual("Guía con tilde", numeroDeGuia("Guía 1234567890"), "1234567890");
igual("N° de envío", numeroDeGuia("N° envio 1234567890"), "1234567890");

console.log("\n── la única cifra larga del texto ──");
igual(
  "una sola candidata",
  numeroDeGuia("SERVIENTREGA QUITO 1234567890 2.5kg"),
  "1234567890"
);

console.log("\n── cuando no se puede saber, se rinde ──");
igual("vacío", numeroDeGuia(""), null);
igual("solo espacios", numeroDeGuia("   "), null);
igual("sin cifras", numeroDeGuia("SERVIENTREGA QUITO"), null);
igual("cifra demasiado corta", numeroDeGuia("12345"), null);
igual("cifra demasiado larga", numeroDeGuia("123456789012345678901234"), null);
igual(
  "dos candidatas sin etiqueta: no adivina",
  numeroDeGuia("1234567890 9876543210"),
  null
);
igual(
  "tres candidatas sin etiqueta tampoco",
  numeroDeGuia("20260827 1234567890 9876543210"),
  null
);

console.log("\n── la etiqueta gana a la ambigüedad ──");
igual(
  "con varias cifras, manda la anunciada",
  numeroDeGuia("FECHA:20260827 GUIA:1234567890 VALOR:1250"),
  "1234567890"
);
igual(
  "la etiqueta gana aunque haya otra más larga",
  numeroDeGuia("guia=1234567890 ref=999999999999999"),
  "1234567890"
);

console.log("\n── repetido no es ambiguo ──");
igual(
  "el mismo número dos veces cuenta como uno",
  numeroDeGuia("1234567890 / 1234567890"),
  "1234567890"
);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
