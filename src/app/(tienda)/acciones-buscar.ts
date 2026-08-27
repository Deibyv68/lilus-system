"use server";

import { listarCatalogo } from "@/lib/tienda";

/**
 * Todo lo publicado, en una lista plana para buscar en el navegador.
 *
 * ── Por qué se manda entero y no una consulta por tecla ──
 *
 * Son unos treinta artículos. Traerlos una vez al abrir el buscador y
 * filtrarlos en el navegador da resultados en el momento, sin esperas ni
 * parpadeos, y sin un viaje al servidor por cada letra que alguien
 * teclea. Con un catálogo de miles habría que hacerlo al revés; con este,
 * ir al servidor sería más lento y más frágil.
 *
 * Solo sale lo que ya es público: esto lo llama cualquiera sin sesión.
 */
export async function listarParaBuscar() {
  const { packs, productos } = await listarCatalogo();
  return [...packs, ...productos].map((a) => ({
    tipo: a.tipo,
    slug: a.slug,
    nombre: a.nombre,
    tagline: a.tagline,
    precio: a.precio,
    imagen: a.imagen,
  }));
}
