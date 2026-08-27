import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ArticuloResumen } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { Revelar } from "@/components/tienda/revelar";

/**
 * Tres artículos, con el titular grande al lado.
 *
 * Es la sección de la referencia donde el texto ocupa una columna entera
 * y los productos la otra. Funciona porque no compite con el catálogo:
 * enseña tres cosas y deja que el titular haga el trabajo de convencer.
 *
 * ── Sobre cuáles se muestran ──
 *
 * Hoy son los tres primeros del catálogo, que es un criterio pobre —
 * salen por orden alfabético, no porque sean los mejores para empezar.
 * Cuando importe, esto debería ser una selección que la dueña elige desde
 * el panel; por eso el texto de al lado no promete cuáles son ni por qué,
 * porque ahora mismo no habría manera de sostenerlo.
 */
export function SeleccionDestacada({
  articulos,
  titulo,
  entrada,
}: {
  articulos: ArticuloResumen[];
  titulo: string;
  entrada: string;
}) {
  if (articulos.length === 0) return null;

  return (
    <section className="grid gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
      <Revelar variante="enfocar">
        <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] text-balance text-white sm:text-7xl">
          {titulo}
        </h2>
        <p className="mt-8 max-w-md text-base leading-[1.7] text-pretty text-tienda-tenue">
          {entrada}
        </p>
        <Link
          href="/tienda"
          className="mt-10 inline-block border-b border-tienda-linea py-2 text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white"
        >
          Ver todo el catálogo
        </Link>
      </Revelar>

      {/*
        En el teléfono se desplazan de lado en vez de apilarse. Tres
        tarjetas apiladas ocupan tres pantallas y empujan el resto de la
        página tan abajo que casi nadie llega; de lado se ven las tres de
        un vistazo y se pasa con el dedo, que es el gesto natural ahí.
      */}
      <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
        {articulos.slice(0, 3).map((a, i) => (
          <Revelar
            as="li"
            key={`${a.tipo}:${a.id}`}
            retardo={i * 80}
            className="w-[62%] shrink-0 snap-start sm:w-[45%] lg:w-auto"
          >
            <Link href={`/tienda/${a.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-tienda-sm bg-tienda-velo">
                <ImagenArticulo
                  url={a.imagen}
                  alt={a.imagenAlt}
                  nombre={a.nombre}
                  className="transition-transform duration-700 ease-tienda group-hover:scale-[1.04]"
                />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-tienda-texto transition-colors duration-[400ms] ease-tienda group-hover:text-white">
                    {a.nombre}
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-tienda-tenue">
                    {formatCurrency(a.precio)}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-tienda-linea text-tienda-texto transition-[background-color,border-color,color] duration-[400ms] ease-tienda group-hover:border-tienda-texto group-hover:bg-tienda-texto group-hover:text-tienda-fondo"
                >
                  <ArrowUpRight className="size-5" strokeWidth={1.5} />
                </span>
              </div>
            </Link>
          </Revelar>
        ))}
      </ul>
    </section>
  );
}
