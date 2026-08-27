import Link from "next/link";

/**
 * La miga de pan: «Inicio / Nosotros».
 *
 * Va centrada y encima del título, como en la referencia. Es pequeña a
 * propósito — no compite con el título, solo dice dónde estás y ofrece la
 * salida hacia atrás.
 *
 * Se marca como `nav` con su etiqueta y la página actual lleva
 * `aria-current`: para quien navega con lector de pantalla esto es de las
 * pocas señales de ubicación que tiene, y sin eso son dos palabras
 * sueltas separadas por una barra.
 */
export function Migas({
  actual,
  intermedio,
}: {
  actual: string;
  /** Un nivel de por medio, si lo hay: «Inicio / Tienda / Jabón de café». */
  intermedio?: { texto: string; href: string };
}) {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.12em] text-tienda-tenue">
        <li>
          <Link
            href="/"
            className="transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
          >
            Inicio
          </Link>
        </li>
        <li aria-hidden className="text-tienda-tenue/50">
          /
        </li>
        {intermedio && (
          <>
            <li>
              <Link
                href={intermedio.href}
                className="transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                {intermedio.texto}
              </Link>
            </li>
            <li aria-hidden className="text-tienda-tenue/50">
              /
            </li>
          </>
        )}
        <li aria-current="page" className="text-tienda-texto">
          {actual}
        </li>
      </ol>
    </nav>
  );
}
