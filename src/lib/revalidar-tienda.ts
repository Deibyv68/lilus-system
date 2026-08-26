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
