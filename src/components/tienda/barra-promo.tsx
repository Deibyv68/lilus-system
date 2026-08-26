import Link from "next/link";
import { Marquesina, duracionCinta } from "@/components/tienda/marquesina";

/**
 * La cinta de promoción de arriba del todo.
 *
 * El mecanismo del bucle está en `marquesina.tsx`. Aquí solo va el texto,
 * repetido unas cuantas veces para que llene la pantalla en cualquier
 * ancho: con una sola repetición, en un monitor grande se vería el texto
 * y después un vacío enorme hasta que vuelva a entrar.
 */

const REPETICIONES = 4;
const ANCHO_CARACTER = 8;

export function BarraPromo({
  texto,
  enlace,
}: {
  texto: string;
  enlace: string | null;
}) {
  const segundos = duracionCinta(texto.length * ANCHO_CARACTER * REPETICIONES);

  const contenido = Array.from({ length: REPETICIONES }, (_, i) => (
    <span key={i} className="flex items-center whitespace-nowrap">
      <span className="px-6">{texto}</span>
      <span aria-hidden="true" className="text-tienda-acento">
        •
      </span>
    </span>
  ));

  const cinta = <Marquesina contenido={contenido} segundos={segundos} />;

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
