/**
 * Comprueba la extracción de datos de un comprobante.
 *
 * Los textos son los que devuelve Tesseract de verdad, no inventados: el
 * del Banco General Rumiñahui está copiado carácter por carácter de la
 * lectura del comprobante que falló, garabatos de OCR incluidos («G>» por
 * un icono, «59-----100» por una cuenta enmascarada). Probar con textos
 * limpios haría pasar todo y no diría nada.
 */
import {
  extraerMonto,
  extraerNumero,
  extraerFecha,
  extraerBanco,
} from "../src/lib/datos-de-comprobante";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(
    `${ok ? "ok  " : "FALLA"} ${que}` +
      (ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`)
  );
}

/* ── El que falló: Banco General Rumiñahui, leído con gris+normalizada ── */
const bgr = `Transferencia Exitosa
$280.00
N° comprobante 223079159
Fecha 28 ago 2026 a las 15:01 horas
G> Para
Sevilla Borja Beatriz Alexandra
BANCO PICHINCHA
Cuenta Ahorros 59-----100
(6 Desde
Veloz Villacis Wilson Hernan
BANCO GENERAL RUMIÑAHUI
Cuenta de Ahorros 81----6900`;

console.log("── el comprobante del BGR que falló ──");
igual("el monto sale del encabezado de color", extraerMonto(bgr), 280);
igual("el número de comprobante", extraerNumero(bgr), "223079159");
igual("la fecha en formato «28 ago 2026»", extraerFecha(bgr), "28 ago 2026");
igual(
  "el banco es el de «Desde», no el de «Para»",
  extraerBanco(bgr),
  "Banco General Rumiñahui"
);
igual(
  "y sigue siéndolo diciéndole cuál es el nuestro",
  extraerBanco(bgr, ["Banco Pichincha"]),
  "Banco General Rumiñahui"
);

/* ── Sin el preprocesado: así se leía antes, y así fallaba ── */
const bgrSinEncabezado = `N° comprobante 223079159
Fecha 28 ago 2026 a las 15:01 horas
Sevilla Borja Beatriz Alexandra
BANCO PICHINCHA
Cuenta Ahorros 59-+----100
Veloz Villacis Wilson Hernan
BANCO GENERAL RUMIÑAHUI
Cuenta de Ahorros 81----6900`;

console.log("\n── el mismo, si el encabezado no se llegara a leer ──");
igual("sin encabezado no hay monto que sacar", extraerMonto(bgrSinEncabezado), null);
igual(
  "pero sin las etiquetas, saber cuál es el nuestro salva el banco",
  extraerBanco(bgrSinEncabezado, ["Banco Pichincha"]),
  "Banco General Rumiñahui"
);

/* ── Otros bancos, con las formas que usa cada uno ── */
console.log("\n── otros bancos ──");
{
  const pichincha = `Banco Pichincha
Transferencia exitosa
Monto $45,50
Comprobante No. 4455667788
Fecha: 12/08/2026
Cuenta destino 2209876543`;
  igual("Pichincha · monto con coma decimal", extraerMonto(pichincha), 45.5);
  igual("Pichincha · número", extraerNumero(pichincha), "4455667788");
  igual("Pichincha · fecha con barras", extraerFecha(pichincha), "12/08/2026");
  igual("Pichincha · un solo banco nombrado", extraerBanco(pichincha), "Banco Pichincha");
}
{
  const guayaquil = `Banco Guayaquil
Valor transferido USD 120.00
Nro. de transaccion 9911223344
28 de agosto de 2026
Ordenante: Maria Alvarado - Banco Guayaquil
Beneficiario: LILUS - Banco Pichincha`;
  igual("Guayaquil · monto con USD", extraerMonto(guayaquil), 120);
  igual("Guayaquil · fecha larga", extraerFecha(guayaquil), "28 de agosto de 2026");
  igual(
    "Guayaquil · el ordenante manda sobre el beneficiario",
    extraerBanco(guayaquil),
    "Banco Guayaquil"
  );
}
{
  const produbanco = `Produbanco
Comprobante de transaccion
Transaccion No. 5566778899
Valor: $1.250,75
Origen: Produbanco Ahorros
Destino: Banco Bolivariano`;
  igual("Produbanco · miles con punto", extraerMonto(produbanco), 1250.75);
  igual("Produbanco · número tras la etiqueta", extraerNumero(produbanco), "5566778899");
  igual("Produbanco · gana el de «Origen»", extraerBanco(produbanco), "Produbanco");
}
{
  const deuna = `DeUna!
Enviaste $15.00
Codigo de transaccion 778899001122
2026-08-28`;
  igual("DeUna · «enviaste» anuncia el monto", extraerMonto(deuna), 15);
  igual("DeUna · fecha ISO", extraerFecha(deuna), "2026-08-28");
  igual("DeUna · la billetera cuenta como banco", extraerBanco(deuna), "DeUna");
}
{
  const bgrSigla = `BGR
Transferencia Exitosa
$50.00`;
  igual("la sigla BGR también se reconoce", extraerBanco(bgrSigla), "Banco General Rumiñahui");
}

console.log("\n── el orden de los bloques puede venir al revés ──");
{
  const alReves = `Desde: Juan Perez - COOPERATIVA JEP
Para: LILUS - BANCO PICHINCHA
Monto $30.00`;
  igual(
    "«Desde» primero: no se lleva el banco del «Para»",
    extraerBanco(alReves),
    "Cooperativa JEP"
  );
}

console.log("\n── lo que no debe inventar ──");
igual("texto sin bancos", extraerBanco("Transferencia exitosa $10"), null);
igual("texto vacío", extraerBanco(""), null);
igual("sin monto reconocible", extraerMonto("Transferencia exitosa"), null);
igual("sin fecha", extraerFecha("Comprobante 123456"), null);
igual(
  "«a las 15:01 horas» no es una fecha",
  extraerFecha("a las 15:01 horas"),
  null
);

/* ── DeUna: el logo es un dibujo y el unico banco escrito es el NUESTRO ── */
const deuna = `d!
Pagaste a Guadalupe Silvia Cajas Robles
Tu dinero llego al instante
$100,00
Este pago te ayuda a cuidar el medio ambiente
Fecha de pago 04 sep 2026 - 10:28 am
Nro. de transaccion 17889887
Bh mS iE (a
El wl Sa
Codigo de verificacion
De
DS Dilon Stalin Erazo Cutos
******9992
Para
GS Guadalupe Silvia Cajas Robles
Banco Pichincha ******7600`;

console.log("");
console.log("── DeUna ──");
igual("el monto grande, con coma decimal", extraerMonto(deuna), 100);
igual("el numero va detras de «Nro. de transaccion»", extraerNumero(deuna), "17889887");
igual("la fecha, sin la hora de al lado", extraerFecha(deuna), "04 sep 2026");
igual(
  "el banco es DeUna, NO el Pichincha del bloque «Para»",
  extraerBanco(deuna),
  "DeUna"
);
igual(
  "...y tampoco cambia si el Pichincha es nuestro",
  extraerBanco(deuna, ["Banco Pichincha"]),
  "DeUna"
);
igual(
  "la basura del QR no se cuela como numero",
  extraerNumero("Bh mS iE (a El wl Sa"),
  null
);

/*
  Con UNA sola marca no alcanza: se exigen dos para no etiquetar de
  DeUna un comprobante ajeno donde aparezca la frase por casualidad.
*/
igual(
  "una marca suelta no convierte nada en DeUna",
  extraerBanco(`Pagaste a Fulano
Banco Guayaquil
Cuenta 123`),
  "Banco Guayaquil"
);

/* ── El unico banco escrito esta bajo «Para» y no hay bloque de origen ── */
igual(
  "un solo banco, y esta en el lado de quien cobra: mejor nada",
  extraerBanco(`Transferencia exitosa
$50,00
Para
Maria Perez
Banco Pichincha
Cuenta 22---33`),
  null
);
igual(
  "pero si NO hay bloque «Para», el unico que hay vale",
  extraerBanco("Transferencia exitosa $50,00 Banco Pichincha Cuenta 22---33"),
  "Banco Pichincha"
);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
