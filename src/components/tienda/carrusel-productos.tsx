import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ArticuloResumen } from "@/lib/tienda";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { Marquesina, duracionCinta } from "@/components/tienda/marquesina";

/**
 * La fila de productos que se desplaza sola.
 *
 * Es un anzuelo, no el catálogo: enseña que hay más cosas y lleva a
 * `/tienda`, donde se compra con calma. Por eso no lleva botón de agregar
 * — pulsar «agregar» en algo que se está moviendo es una trampa.
 *
 * Se detiene al pasar el cursor y al llegar con el tabulador. Sin eso,
 * intentar hacer clic en una tarjeta que huye es de las cosas más
 * molestas que puede hacer una web.
 */

/** Ancho de cada tarjeta más su separación, para calcular la duración. */
const ANCHO_TARJETA = 260;

export function CarruselProductos({ articulos }: { articulos: ArticuloResumen[] }) {
  if (articulos.length === 0) return null;

  const segundos = duracionCinta(articulos.length * ANCHO_TARJETA, 45);

  const contenido = articulos.map((a) => (
    <Link
      key={`${a.tipo}:${a.id}`}
      href={`/tienda/${a.slug}`}
      className="group mr-6 block w-[220px] shrink-0"
    >
      <div className="relative aspect-square overflow-hidden rounded-tienda-sm bg-tienda-velo">
        <ImagenArticulo
          url={a.imagen}
          alt={a.imagenAlt}
          nombre={a.nombre}
          className="transition-transform duration-700 ease-tienda group-hover:scale-[1.05]"
        />
      </div>
      <p className="mt-4 truncate text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda group-hover:text-white">
        {a.nombre}
      </p>
      <p className="mt-0.5 text-sm tabular-nums text-tienda-tenue">
        {formatCurrency(a.precio)}
      </p>
    </Link>
  ));

  return (
    <div className="overflow-hidden">
      <Marquesina contenido={contenido} segundos={segundos} pausarAlTocar />
    </div>
  );
}
