import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

/**
 * Cómo se empaqueta la tienda para Cloudflare.
 *
 * La caché va en R2 y no en memoria porque un Worker se levanta y se
 * muere todo el rato: con caché por instancia, casi toda visita caería en
 * una recién nacida que tendría que volver a preguntar a la base en
 * Virginia. Medimos ese camino y eran 2,5 segundos para pintar el
 * catálogo — justo lo que el trabajo de caché venía a quitar.
 *
 * El bucket se declara en `wrangler.jsonc`, en el enlace
 * `NEXT_INC_CACHE_R2_BUCKET`.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
