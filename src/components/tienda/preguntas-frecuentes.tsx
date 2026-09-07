import Link from "next/link";
import type { Pregunta } from "@/lib/preguntas-frecuentes";
import { Revelar } from "@/components/tienda/revelar";

/**
 * Las preguntas frecuentes de la portada.
 *
 * ── Por qué no se desvanece por abajo ──
 *
 * Ocupa el sitio donde estaban los testimonios, que llevaban una máscara
 * que difuminaba el final de la sección: quedaba bonito y sugería que
 * había más. Aquí no vale. Difuminar la última respuesta de unas preguntas
 * frecuentes es esconder justo lo que alguien vino a leer.
 *
 * ── Por qué todo abierto y no un acordeón ──
 *
 * Un acordeón obliga a adivinar dónde está tu duda y a hacer clic para
 * comprobar. Con nueve preguntas cortas cabe todo a la vista, se lee de un
 * barrido, y además queda en la página para quien busque en Google
 * «cuánto dura un jabón artesanal».
 */
export function PreguntasFrecuentes({
  preguntas,
  titulo,
  entrada,
}: {
  preguntas: Pregunta[];
  titulo: string;
  entrada: string;
}) {
  if (preguntas.length === 0) return null;

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
        Columnas CSS, como en el resto de la tienda: cada tarjeta mide lo
        que mida su texto y se acomodan solas. Una cuadrícula estiraría
        todas a la altura de la más larga.
      */}
      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
        {preguntas.map((p, i) => (
          <Revelar
            key={p.pregunta}
            retardo={(i % 3) * 70}
            className="mb-6 break-inside-avoid"
          >
            <article className="rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt p-7">
              <h3 className="font-display text-xl leading-[1.25] tracking-[-0.01em] text-white">
                {p.pregunta}
              </h3>

              <p className="mt-3 text-sm leading-[1.7] text-pretty text-tienda-texto">
                {p.respuesta}
              </p>

              {p.filas && (
                <dl className="mt-5 space-y-2.5 border-t border-tienda-linea pt-5">
                  {p.filas.map((f) => (
                    <div
                      key={f.uso}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <dt className="min-w-0 text-sm text-tienda-tenue">{f.uso}</dt>
                      <dd className="shrink-0 text-sm text-white tabular-nums">
                        {f.duracion}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {p.enlace && (
                <Link
                  href={p.enlace.href}
                  className="mt-5 inline-block text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-white"
                >
                  {p.enlace.texto}
                </Link>
              )}
            </article>
          </Revelar>
        ))}
      </div>
    </section>
  );
}
