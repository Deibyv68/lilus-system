/** Comprueba la aritmética del pago con los casos que de verdad pasan. */
import { estadoDePago } from "../src/lib/pago-del-pedido";
import { extraerBanco } from "../src/lib/datos-de-comprobante";

let fallos = 0;
function igual(que: string, dio: unknown, esperado: unknown) {
  const ok = JSON.stringify(dio) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "ok  " : "FALLA"} ${que}${ok ? "" : ` → ${JSON.stringify(dio)}, esperaba ${JSON.stringify(esperado)}`}`);
}

const sinRevisar = (montoLeido: number | null) => ({ aceptado: null, montoConfirmado: null, montoLeido });
const aceptado = (montoConfirmado: number) => ({ aceptado: true, montoConfirmado, montoLeido: null });
const descartado = { aceptado: false, montoConfirmado: null, montoLeido: 99 };

console.log("── lo que lee la máquina no paga nada ──");
{
  const e = estadoDePago([sinRevisar(25.5)], 25.5);
  igual("un comprobante sin revisar deja el confirmado en 0", e.confirmado, 0);
  igual("...y falta el total entero", e.falta, 25.5);
  igual("...no cuadra", e.cuadra, false);
  igual("...pero se sabe lo que dice", e.dicenPorRevisar, 25.5);
  igual("...y que hay uno esperando", e.porRevisar, 1);
}

console.log("\n── abonos: dos comprobantes que suman ──");
{
  const e = estadoDePago([aceptado(12), aceptado(13.5)], 25.5);
  igual("suman el total", e.confirmado, 25.5);
  igual("no falta nada", e.falta, 0);
  igual("cuadra", e.cuadra, true);
}
{
  const e = estadoDePago([aceptado(12)], 25.5);
  igual("con la mitad aceptada, falta la otra mitad", e.falta, 13.5);
  igual("...y no cuadra todavía", e.cuadra, false);
  igual("...ni sobra nada", e.sobra, 0);
}
{
  const e = estadoDePago([aceptado(12), sinRevisar(13.5)], 25.5);
  igual("el segundo sin revisar no cierra la cuenta", e.falta, 13.5);
  igual("...aunque diga justo lo que falta", e.dicenPorRevisar, 13.5);
}

console.log("\n── coma flotante ──");
{
  const e = estadoDePago([aceptado(8.5), aceptado(17)], 25.5);
  igual("8.50 + 17.00 cuadra con 25.50", e.cuadra, true);
  igual("...y falta exactamente 0", e.falta, 0);
}
{
  const e = estadoDePago([aceptado(0.1), aceptado(0.2)], 0.3);
  igual("0.10 + 0.20 cuadra con 0.30", e.cuadra, true);
}

console.log("\n── un centavo de margen ──");
{
  igual("faltando un centavo, cuadra", estadoDePago([aceptado(25.49)], 25.5).cuadra, true);
  igual("faltando dos, no", estadoDePago([aceptado(25.48)], 25.5).cuadra, false);
}

console.log("\n── de más ──");
{
  const e = estadoDePago([aceptado(30)], 25.5);
  igual("sobran 4.50", e.sobra, 4.5);
  igual("...no falta nada", e.falta, 0);
  igual("...y cuadra (está cubierto)", e.cuadra, true);
}

console.log("\n── descartados ──");
{
  const e = estadoDePago([descartado, aceptado(25.5)], 25.5);
  igual("el descartado no suma", e.confirmado, 25.5);
  igual("...pero se cuenta", e.descartados, 1);
  igual("...y no cuenta como pendiente", e.porRevisar, 0);
}

console.log("\n── sin comprobantes ──");
{
  const e = estadoDePago([], 25.5);
  igual("no hay comprobantes", e.hayComprobantes, false);
  igual("falta todo", e.falta, 25.5);
}

console.log("\n── el banco ──");
igual("Pichincha", extraerBanco("Banco Pichincha\nTransferencia exitosa"), "Banco Pichincha");
igual("sin tildes", extraerBanco("BANCO DEL PACIFICO"), "Banco del Pacífico");
igual("con tildes", extraerBanco("Banco del Pacífico"), "Banco del Pacífico");
igual("Produbanco no se confunde con «banco»", extraerBanco("Produbanco"), "Produbanco");
igual(
  "gana el que aparece antes (origen arriba, destino abajo)",
  extraerBanco("Banco Guayaquil\nTransferencia\nCuenta destino\nBanco Pichincha 2209876543"),
  "Banco Guayaquil"
);
igual("DeUna", extraerBanco("Pago con DeUna exitoso"), "DeUna");
igual("«de una» suelto no es DeUna", extraerBanco("Se transfirio desde una cuenta de ahorros"), null);
igual("una cooperativa", extraerBanco("COOP. JEP\nComprobante"), "Cooperativa JEP");
igual("lo que no está en la lista sale vacío", extraerBanco("Banco Inventado del Sur"), null);
igual("texto vacío", extraerBanco(""), null);

console.log(fallos === 0 ? "\nTodo bien." : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
