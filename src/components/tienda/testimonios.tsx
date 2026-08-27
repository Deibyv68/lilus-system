import type { Testimonio } from "@/lib/testimonios";
import { Revelar } from "@/components/tienda/revelar";

/**
 * Lo que dicen las clientas.
 *
 * ⚠️ Hoy se alimenta de datos de muestra inventados. Ver la advertencia
 * de `src/lib/testimonios.ts` antes de publicar la web.
 *
 * ── Las iniciales en vez de fotos ──
 *
 * La referencia pone retratos. Aquí van iniciales en un círculo, y no es
 * por ahorrar trabajo: poner caras de bancos de imágenes junto a un
 * testimonio hace pasar a una persona real y ajena por clienta de LILUS.
 * Cuando haya testimonios de verdad, quien quiera puede mandar su foto —
 * y mientras tanto las iniciales no le mienten a nadie.
 *
 * ── El desvanecido de abajo ──
 *
 * Es la profundidad de la referencia: la sección sigue más allá de lo que
 * se ve. Se hace con una máscara, que solo afecta a lo que se pinta: el
 * texto sigue completo en la página para quien use lector de pantalla o
 * para un buscador.
 */
export function Testimonios({
  testimonios,
  titulo,
  entrada,
}: {
  testimonios: Testimonio[];
  titulo: string;
  entrada: string;
}) {
  if (testimonios.length === 0) return null;

  return (
    <section>
      <Revelar className="mb-14 grid gap-6 lg:grid-cols-2 lg:items-start">
        <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] text-balance text-white sm:text-7xl">
          {titulo}
        </h2>
        <p className="max-w-md text-sm leading-[1.7] text-tienda-tenue lg:justify-self-end lg:text-right">
          {entrada}
        </p>
      </Revelar>

      {/*
        Columnas CSS en vez de cuadrícula: dejan que cada tarjeta mida lo
        que mida su texto y se acomoden solas, que es el desorden ordenado
        de la referencia. Una cuadrícula obligaría a todas a la altura de
        la más larga.
      */}
      <div className="testimonios-desvanecidos columns-1 gap-6 sm:columns-2 lg:columns-3">
        {testimonios.map((t, i) => (
          <Revelar key={t.nombre} retardo={(i % 3) * 70} className="mb-6 break-inside-avoid">
            <figure className="rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt p-7">
              <blockquote className="text-base leading-[1.6] text-pretty text-tienda-texto">
                {t.texto}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-tienda-velo text-sm text-tienda-texto"
                >
                  {iniciales(t.nombre)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">
                    {t.nombre}
                  </span>
                  <span className="block truncate text-xs text-tienda-tenue">
                    {t.detalle}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Revelar>
        ))}
      </div>
    </section>
  );
}

/** `Andrea Salazar` → `AS`. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
