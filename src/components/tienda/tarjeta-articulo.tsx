import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ArticuloResumen } from "@/lib/tienda";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";

/**
 * La tarjeta de un artículo en una cuadrícula.
 *
 * Vive aquí y no en cada página porque estaba copiada en dos, y la
 * segunda copia es donde los arreglos no llegan: el desbordamiento en
 * móvil que motivó este archivo estaba en las dos.
 *
 * ── Por qué el precio y el botón se apilan en móvil ──
 *
 * En una pantalla de 375 px, dos columnas dejan 151 px por tarjeta. El
 * botón «Agregar» mide 129 y el precio unos 50: juntos en una fila no
 * caben, y como los hijos de una cuadrícula no encogen por debajo de su
 * contenido, la tarjeta empujaba hacia fuera y la página entera se movía
 * de lado. Apilados caben de sobra.
 */
export function TarjetaArticulo({
  articulo,
  prioridad = false,
}: {
  articulo: ArticuloResumen;
  prioridad?: boolean;
}) {
  return (
    // min-w-0 no es decorativo: sin él, un hijo de cuadrícula se niega a
    // encogerse por debajo del ancho de su contenido y desborda la fila.
    <article className="flex h-full min-w-0 flex-col">
      {/*
        La foto y el nombre son un solo enlace. Que sean dos destinos
        distintos hacia el mismo sitio no ayuda a nadie y estorba a quien
        navega con teclado o lector de pantalla.
      */}
      <Link href={`/tienda/${articulo.slug}`} className="group min-w-0">
        <div className="relative aspect-square overflow-hidden rounded-tienda-sm bg-tienda-velo sm:rounded-tienda">
          <ImagenArticulo
            url={articulo.imagen}
            alt={articulo.imagenAlt}
            nombre={articulo.nombre}
            prioridad={prioridad}
            className="transition-transform duration-700 ease-tienda group-hover:scale-[1.04]"
          />
        </div>

        <h3 className="mt-4 font-display text-xl leading-tight tracking-[-0.02em] text-white transition-colors duration-[400ms] ease-tienda group-hover:text-tienda-acento sm:mt-5 sm:text-2xl">
          {articulo.nombre}
        </h3>
      </Link>

      {articulo.tagline && (
        <p className="mt-1.5 text-sm leading-snug text-pretty text-tienda-tenue">
          {articulo.tagline}
        </p>
      )}

      {/* mt-auto: los botones quedan alineados aunque los textos midan distinto. */}
      <div className="mt-auto flex flex-col items-start gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
        <span className="tabular-nums text-tienda-texto">
          {formatCurrency(articulo.precio)}
        </span>
        <BotonAgregar articulo={articulo} className="w-full sm:w-auto" />
      </div>
    </article>
  );
}
