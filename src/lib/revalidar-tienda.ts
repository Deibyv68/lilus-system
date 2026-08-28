import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Tira el caché de la tienda.
 *
 * El catálogo y las fichas se sirven cacheados: son las páginas que más
 * se piden y las que menos cambian, y esto corre en una laptop de casa.
 * Pero «no cambian» no es «nunca cambian», y el tiempo de caché no puede
 * ser la única forma de enterarse.
 *
 * Sin esto, la dueña publica un producto, va a mirar la tienda, no lo ve,
 * y concluye —con razón— que algo se rompió. Media hora después aparece
 * solo. Ese comportamiento destruye la confianza en la herramienta más
 * rápido que un error visible.
 *
 * Se llama desde cualquier acción del panel que cambie lo que la tienda
 * muestra: productos, packs y tarifas de envío.
 */
export function revalidarTienda() {
  // El catálogo.
  revalidatePath("/");

  // Todas las fichas de una vez. Con el patrón de ruta en vez de un slug
  // concreto porque un producto aparece en más sitios que el suyo: si se
  // le cambia el nombre, hay que refrescar también las fichas de los packs
  // que lo contienen, y averiguar cuáles son es más trabajo que refrescar
  // todo. Son treinta páginas, no treinta mil.
  revalidatePath("/[slug]", "page");

  // El mapa del sitio se arma desde el catálogo, así que envejece con él.
  revalidatePath("/sitemap.xml");
}

/**
 * Tira el caché de la tienda ENTERA, plantilla incluida.
 *
 * ── Por qué hace falta otra ──
 *
 * `revalidarTienda()` refresca las páginas que enseñan el catálogo. Pero
 * hay cosas que no viven en una página sino en la plantilla que envuelve
 * a todas: la cinta de promoción, el nombre de la marca, los enlaces de
 * contacto del pie.
 *
 * Casi toda la tienda se genera estática —es lo correcto: son las
 * páginas que más se piden y esto corre en una laptop de casa— así que
 * la plantilla queda impresa dentro de cada una en el momento de
 * compilar. Cambiar el ajuste no las despierta, y algunas (`/carrito`,
 * las legales) ni siquiera tienen tiempo de caducidad: se quedarían con
 * la promoción vieja hasta el siguiente despliegue.
 *
 * Con `"layout"` se invalida la plantilla y todo lo que cuelga de ella.
 * Es más de lo que hace falta para un solo ajuste, pero los ajustes se
 * tocan tres veces al año y las páginas se regeneran al pedirlas, de una
 * en una. Barato comparado con la alternativa: cambiar algo, ir a
 * mirarlo, no verlo, y no saber si está roto o solo tarda.
 */
export function revalidarTiendaEntera() {
  revalidatePath("/", "layout");
}
