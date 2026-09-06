"use client";

import { useSearchParams } from "next/navigation";
import type { ArticuloResumen } from "@/lib/tienda";
import { Vista } from "./vista";

/**
 * El catálogo, filtrado por lo que traiga `?q=` en la URL.
 *
 * ── Por qué la búsqueda se resuelve aquí y no en el servidor ──
 *
 * Porque leer `?q=` en el servidor obliga a Next a tratar la página como
 * distinta en cada visita, y entonces no se puede guardar. Eso costaba
 * caro: con la base en la nube, pintar el catálogo son unas veinte
 * consultas y cada una cruza medio continente.
 *
 * Leyéndolo aquí, la página se compila una sola vez con todo el catálogo
 * dentro y se sirve sin tocar la base. La búsqueda pasa a ser cosa del
 * navegador sobre datos que ya tiene: además de no costar nada, filtra al
 * instante en vez de esperar a que el servidor conteste.
 *
 * ── Qué NO cambia ──
 *
 * La dirección sigue siendo `/tienda?q=lavanda`, se puede compartir y
 * funciona si la escribes a mano. El contrato de la URL es el mismo; lo
 * único que cambió es quién la lee.
 */
export function Filtrado({
  packs,
  productos,
}: {
  packs: ArticuloResumen[];
  productos: ArticuloResumen[];
}) {
  const busqueda = (useSearchParams().get("q") ?? "").trim();
  return <Vista packs={packs} productos={productos} busqueda={busqueda} />;
}
