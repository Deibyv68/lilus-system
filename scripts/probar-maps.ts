/** Comprueba la lectura de enlaces de Google Maps con las formas reales. */
import { leerPunto, esEnlaceCorto, enlaceDeMaps } from "../src/lib/punto-de-maps";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${que}${ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`}`);
}

const quito = { lat: -0.1807, lng: -78.4678 };

console.log("── las formas que genera Google Maps ──");
igual(
  "el sitio exacto gana a la cámara",
  leerPunto("https://www.google.com/maps/place/Quito/@-0.2,-78.5,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-0.1807!4d-78.4678"),
  quito
);
igual(
  "solo la cámara",
  leerPunto("https://www.google.com/maps/@-0.1807,-78.4678,17z"),
  quito
);
igual(
  "enlace de «compartir» con query",
  leerPunto("https://www.google.com/maps/search/?api=1&query=-0.1807,-78.4678"),
  quito
);
igual(
  "con la coma escapada, como llega de WhatsApp",
  leerPunto("https://www.google.com/maps/search/?api=1&query=-0.1807%2C-78.4678"),
  quito
);
igual("con ?q=", leerPunto("https://maps.google.com/?q=-0.1807,-78.4678"), quito);
igual("con &ll=", leerPunto("https://maps.google.com/maps?ll=-0.1807,-78.4678&z=17"), quito);
igual(
  "el par suelto, copiado a pelo",
  leerPunto("-0.1807, -78.4678"),
  quito
);
igual("sin espacio", leerPunto("-0.1807,-78.4678"), quito);

console.log("\n── lo que NO debe aceptar ──");
igual("texto cualquiera", leerPunto("de las alondras y de los quindes"), null);
igual("vacío", leerPunto(""), null);
igual("solo espacios", leerPunto("   "), null);
igual("un enlace corto todavía sin resolver", leerPunto("https://maps.app.goo.gl/AbCdEf123"), null);
igual(
  "coordenadas fuera de Ecuador (París)",
  leerPunto("https://www.google.com/maps/@48.8566,2.3522,17z"),
  null
);
igual(
  "un par de números que no eran coordenadas",
  leerPunto("Pedido 1234, total 56"),
  null
);
igual(
  "dos números dentro de una frase no cuentan",
  leerPunto("la casa está en -0.1807, -78.4678 más o menos"),
  null
);
igual("latitud imposible", leerPunto("120.5, -78.4"), null);

console.log("\n── los cortos se reconocen para pedir ayuda al servidor ──");
igual("maps.app.goo.gl", esEnlaceCorto("https://maps.app.goo.gl/AbCdEf"), true);
igual("goo.gl/maps", esEnlaceCorto("https://goo.gl/maps/AbCdEf"), true);
igual("con espacios alrededor", esEnlaceCorto("  https://maps.app.goo.gl/X  "), true);
igual("un enlace largo no lo es", esEnlaceCorto("https://www.google.com/maps/@-0.18,-78.46,17z"), false);
igual("texto suelto tampoco", esEnlaceCorto("hola"), false);

console.log("\n── ida y vuelta ──");
igual(
  "lo que generamos se puede volver a leer",
  leerPunto(enlaceDeMaps(quito)),
  quito
);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
