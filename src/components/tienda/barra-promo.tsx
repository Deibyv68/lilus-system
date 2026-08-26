import Link from "next/link";

/**
 * La cinta de promoción.
 *
 * Un texto que se desplaza de derecha a izquierda, sin fin.
 *
 * ── Cómo se hace que no se corte ──
 *
 * El truco es tener el texto DOS veces, una detrás de la otra, y mover
 * las dos juntas exactamente la mitad de su ancho total. Cuando la
 * primera copia termina de salir por la izquierda, la segunda está justo
 * donde estaba la primera al empezar, la animación vuelve a cero y el
 * salto no se ve. Con una sola copia habría un hueco al final.
 *
 * ── Lo que oye un lector de pantalla ──
 *
 * Una sola vez. Las copias van con `aria-hidden`, porque si no, quien
 * navega a ciegas escucharía «10 % de descuento» ocho veces seguidas sin
 * entender por qué.
 *
 * ── La velocidad ──
 *
 * Sale de la longitud del texto, no de un número fijo. Con una duración
 * fija, un texto corto pasaría volando y uno largo se arrastraría. Así
 * cualquier promoción se desplaza al mismo ritmo de lectura.
 */

/** Cuántas veces se repite el texto dentro de cada copia. */
const REPETICIONES = 4;

/** Píxeles por segundo. Ritmo de lectura cómodo, ni carrera ni bostezo. */
const VELOCIDAD = 60;

/** Ancho aproximado de un carácter, para estimar la duración. */
const ANCHO_CARACTER = 8;

export function BarraPromo({
  texto,
  enlace,
}: {
  texto: string;
  enlace: string | null;
}) {
  const anchoCopia = texto.length * ANCHO_CARACTER * REPETICIONES;
  const segundos = Math.max(12, Math.round(anchoCopia / VELOCIDAD));

  const copia = (oculta: boolean) => (
    <div
      className="flex shrink-0 items-center"
      aria-hidden={oculta ? "true" : undefined}
    >
      {Array.from({ length: REPETICIONES }, (_, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6">{texto}</span>
          <span aria-hidden="true" className="text-tienda-acento">
            •
          </span>
        </span>
      ))}
    </div>
  );

  const cinta = (
    <div
      className="marquesina flex"
      style={{ ["--marquesina-dur" as string]: `${segundos}s` }}
    >
      {copia(false)}
      {copia(true)}
    </div>
  );

  return (
    <div className="overflow-hidden border-b border-tienda-linea bg-tienda-fondo-alt py-2.5 text-xs tracking-[0.06em] text-tienda-tenue">
      {enlace ? (
        <Link
          href={enlace}
          className="block transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
        >
          {cinta}
        </Link>
      ) : (
        cinta
      )}
    </div>
  );
}
