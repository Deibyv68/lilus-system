import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

/**
 * Cómo se empaqueta la tienda para Cloudflare.
 *
 * ── La caché no es opcional ──
 *
 * Se probó a quitarla, para descartarla como causa de un cuelgue, y el
 * resultado fue peor: dejaron de responder también las páginas estáticas.
 * Tiene sentido. Sin una caché compartida, cada instancia del Worker cree
 * que todo está caducado y lanza su propia revalidación; como el Worker se
 * llama a sí mismo para eso, unas cuantas visitas seguidas bastan para
 * que se ahogue solo.
 *
 * Va en R2 y no en memoria por lo mismo: un Worker se levanta y se muere
 * todo el rato, y una caché por instancia es casi ninguna caché.
 *
 * El bucket se declara en `wrangler.jsonc`, en `NEXT_INC_CACHE_R2_BUCKET`.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
