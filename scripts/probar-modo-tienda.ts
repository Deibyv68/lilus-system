/**
 * Comprueba qué queda dentro y qué queda fuera cuando el despliegue es
 * solo la tienda.
 *
 * Esta lista decide qué se expone a internet en el despliegue de la
 * nube, así que se prueba entera y con nombres: una ruta del panel que
 * se cuele aquí es el panel publicado, y una de la tienda que se caiga
 * es la tienda rota.
 */
import { fueraDeLaTienda } from "../src/lib/modo-tienda";

let fallos = 0;
function pasa(ruta: string) {
  const fuera = fueraDeLaTienda(ruta);
  if (fuera) fallos++;
  console.log(`${fuera ? "FALLA" : "ok   "} pasa      ${ruta}`);
}
function bloquea(ruta: string) {
  const fuera = fueraDeLaTienda(ruta);
  if (!fuera) fallos++;
  console.log(`${fuera ? "ok   " : "FALLA"} bloquea   ${ruta}`);
}

console.log("── La tienda tiene que seguir entera ──");
pasa("/");
pasa("/tienda");
pasa("/tienda/jabon-de-arroz");
pasa("/packs/pack-serenidad-y-calma");
pasa("/carrito");
pasa("/checkout");
pasa("/rastrear");
pasa("/nosotros");
pasa("/contacto");
pasa("/legal/terminos");
pasa("/legal/privacidad");
pasa("/legal/devoluciones");
pasa("/pedido/abc123token");
pasa("/pedir/abc123token");
pasa("/sitemap.xml");
pasa("/robots.txt");
pasa("/manifest.webmanifest");

console.log("");
console.log("── Lo único de /api que la tienda necesita ──");
pasa("/api/comprobante/cmabc123");
pasa("/api/comprobante/cmabc123/lectura");

console.log("");
console.log("── El panel no existe aquí ──");
bloquea("/sistema");
bloquea("/sistema/pedidos");
bloquea("/sistema/pedidos/cmabc123");
bloquea("/sistema/configuracion");
bloquea("/sistema/recetario/jabon-de-cafe");
bloquea("/sistema/ubicacion");
bloquea("/sistema/compartido");
bloquea("/login");
bloquea("/login/pin");

console.log("");
console.log("── Ni el agente, ni la app, ni las rutas internas ──");
bloquea("/api/agent/config");
bloquea("/api/agent/status");
bloquea("/api/print-queue");
bloquea("/api/print-queue/cmabc/done");
bloquea("/api/print/standalone/enqueue");
bloquea("/api/movil/sesion");
bloquea("/api/movil/pedidos");
bloquea("/api/orders/cmabc/print");
bloquea("/api/customers/search");
bloquea("/api/compartir");
bloquea("/api/compartido/foto.jpg");

console.log("");
console.log("── Una ruta de /api que todavía no existe nace CERRADA ──");
bloquea("/api/algo-que-alguien-agregue-mañana");
bloquea("/api");

console.log("");
console.log("── Y no se cuela nada por parecerse al nombre ──");
/*
  `/sistemas-de-limpieza` empieza con «/sistema» como cadena, pero no es
  una subruta del panel. Si se bloqueara, una página de tienda que
  mañana se llame así desaparecería sin que nadie entienda por qué.
*/
pasa("/sistemas-de-limpieza");
pasa("/loginformativo");
/* Y al revés: nada que se parezca a la excepción de /api debe abrirla. */
bloquea("/api/comprobantes-todos");

console.log("");
console.log(fallos === 0 ? "Todo bien." : `${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
