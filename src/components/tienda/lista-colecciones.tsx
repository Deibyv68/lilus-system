import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ArticuloResumen } from "@/lib/tienda";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { Revelar } from "@/components/tienda/revelar";

/**
 * Las colecciones, como lista que se abre al pasar el cursor.
 *
 * Cada fila lleva a la presentación del pack (/packs/…), no a la ficha de
 * compra: quien está mirando nombres todavía no decidió, y la
 * presentación es la que cuenta qué es cada uno. Desde ahí se compra.
 *
 * Es la sección de la referencia que se me pasó: yo la había sustituido
 * por una cuadrícula de tarjetas, y no es lo mismo. Una cuadrícula enseña
 * cinco cosas a la vez y obliga a compararlas; esta lista enseña los
 * nombres en grande y va revelando la foto solo de lo que a uno le
 * interesa. Vende distinto: primero el nombre, la imagen después.
 *
 * ── Por qué el despliegue solo existe si hay ratón ──
 *
 * Va dentro de `@media (hover: hover)`. En un teléfono no hay cursor: si
 * se dejara, el navegador simula el hover en el primer toque y la fila se
 * abriría en vez de navegar — habría que tocar dos veces cada enlace sin
 * que nada explique por qué. Ahí la fila es simplemente un enlace, con la
 * foto siempre visible en pequeño.
 *
 * ── Lo que se anima ──
 *
 * El relleno vertical y la opacidad, no la altura. Animar `height` obliga
 * al navegador a recalcular la página entera en cada fotograma; el
 * relleno de un elemento que ya tiene su sitio, no.
 */
export function ListaColecciones({
  packs,
}: {
  packs: (ArticuloResumen & { descripcion: string | null })[];
}) {
  if (packs.length === 0) return null;

  return (
    <section className="relative">
      {/*
        La palabra gigante de fondo. Decorativa: ya está escrita arriba
        como título de verdad, y que un lector de pantalla la repita
        girada no aporta nada.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-4 top-0 hidden select-none font-display text-[10rem] leading-none tracking-[-0.02em] text-white/[0.03] lg:block"
        style={{ writingMode: "vertical-rl" }}
      >
        Colecciones
      </span>

      <div className="lg:pl-40">
        <Revelar className="mb-16 grid gap-6 sm:grid-cols-2 sm:items-start">
          <h2 className="font-display text-4xl leading-none tracking-[-0.01em] text-tienda-texto uppercase sm:text-6xl">
            Nuestros packs
          </h2>
          <p className="text-sm leading-[1.7] text-tienda-tenue sm:text-right">
            Cada uno reúne lo que se usa junto: los jabones, la crema y el
            aroma de un mismo ritual. Salen mejor que comprarlos por separado.
          </p>
        </Revelar>

        <ul className="border-t border-tienda-linea">
          {packs.map((p, i) => (
            <Revelar as="li" key={p.id} retardo={i * 60}>
              <Link
                href={`/packs/${p.slug}`}
                className="fila-coleccion group relative block overflow-hidden border-b border-tienda-linea"
              >
                {/*
                  La foto vive detrás de todo y aparece al pasar el cursor.
                  El velo encima es lo que mantiene el texto legible: sin
                  él, un nombre blanco sobre una foto clara desaparece.
                */}
                <span
                  aria-hidden="true"
                  className="fila-foto pointer-events-none absolute inset-0 opacity-0"
                >
                  <ImagenArticulo
                    url={p.imagen}
                    alt={null}
                    nombre={p.nombre}
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-tienda-fondo/70" />
                </span>

                <div className="fila-cuerpo relative flex items-center gap-4 py-7 sm:gap-6">
                  <h3 className="fila-nombre shrink-0 font-display text-3xl leading-none tracking-[-0.01em] text-tienda-tenue sm:text-5xl">
                    {p.nombre}
                  </h3>

                  {p.tagline && (
                    <p className="min-w-0 flex-1 truncate text-sm text-tienda-tenue">
                      {p.tagline}
                    </p>
                  )}

                  {/*
                    La descripción solo cabe cuando la fila está abierta, y
                    solo hay sitio en pantalla ancha.
                  */}
                  {p.descripcion && (
                    <p className="fila-descripcion hidden max-w-xs text-sm leading-snug text-tienda-texto opacity-0 lg:block">
                      {p.descripcion}
                    </p>
                  )}

                  <span
                    aria-hidden="true"
                    className="fila-flecha grid size-11 shrink-0 place-items-center rounded-full border border-tienda-linea text-tienda-texto"
                  >
                    <ArrowUpRight className="size-5" strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
