import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import type { ProductoDelPack } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";

/**
 * Una de las piezas de un pack, que se abre al pulsarla.
 *
 * ── Por qué `<details>` y no un estado de React ──
 *
 * Porque el navegador ya sabe hacer esto. Con `<details>` la pieza se abre
 * sin JavaScript, se anuncia sola como plegable a los lectores de
 * pantalla, responde a la tecla Enter, y el buscador ve el contenido
 * aunque esté cerrado. Reimplementarlo a mano habría costado más y
 * funcionado peor.
 *
 * ── Cómo se anima algo de altura desconocida ──
 *
 * El truco es una cuadrícula de una fila que pasa de `0fr` a `1fr`. Eso
 * sí se puede animar, mientras que `height: auto` no. La alternativa
 * clásica es un `max-height` inventado, que o corta el texto largo o deja
 * la animación con un tirón al final.
 */
export function PiezaDelPack({
  pieza,
  indice,
}: {
  pieza: ProductoDelPack;
  indice: number;
}) {
  const numero = String(indice + 1).padStart(2, "0");

  return (
    <details className="pieza group border-b border-tienda-linea">
      <summary className="flex cursor-pointer list-none items-center gap-4 py-6 sm:gap-6">
        <span
          aria-hidden="true"
          className="shrink-0 font-display text-xl tabular-nums text-tienda-tenue/60"
        >
          {numero}
        </span>

        <span className="relative size-16 shrink-0 overflow-hidden rounded-tienda-sm bg-tienda-velo sm:size-20">
          <ImagenArticulo url={pieza.imagen} alt={null} nombre={pieza.nombre} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl leading-tight tracking-[-0.01em] text-white sm:text-3xl">
            {pieza.cantidad > 1 && (
              <span className="text-tienda-tenue">{pieza.cantidad}× </span>
            )}
            {pieza.nombre}
          </span>
          {pieza.tagline && (
            <span className="mt-1 block truncate text-sm text-tienda-tenue">
              {pieza.tagline}
            </span>
          )}
        </span>

        {/*
          Gira 45° al abrir: el mismo signo pasa de «+» a «×» sin cambiar
          de icono, así que la transición es continua en vez de un salto.
        */}
        <span
          aria-hidden="true"
          className="pieza-signo grid size-11 shrink-0 place-items-center rounded-full border border-tienda-linea text-tienda-texto"
        >
          <Plus className="size-5" strokeWidth={1.5} />
        </span>
      </summary>

      <div className="pieza-cuerpo grid">
        <div className="overflow-hidden">
          <div className="pb-8 pl-0 sm:pl-[7.5rem]">
            {pieza.ingredientes && (
              <p className="max-w-xl text-base leading-[1.7] text-pretty text-tienda-texto">
                {pieza.ingredientes}
              </p>
            )}

            <p className="mt-4 text-sm text-tienda-tenue">
              Suelto cuesta{" "}
              <span className="tabular-nums">{formatCurrency(pieza.precio)}</span>
            </p>

            {pieza.slug && (
              <Link
                href={`/tienda/${pieza.slug}`}
                className="mt-5 inline-flex items-center gap-2 py-2 text-sm text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
              >
                Verlo suelto
                <ArrowUpRight className="size-4" strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
