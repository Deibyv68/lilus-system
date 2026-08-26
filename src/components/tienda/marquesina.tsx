/**
 * Una cinta que se desplaza sin fin.
 *
 * La usan la barra de promoción, el carrusel de productos y el texto
 * grande del cierre. El truco vive aquí y en un solo sitio: tenerlo
 * copiado en tres componentes es tenerlo mal en dos de ellos, tarde o
 * temprano.
 *
 * ── Cómo se hace que no se corte ──
 *
 * El contenido va DOS veces, una detrás de otra, y las dos se mueven
 * exactamente la mitad del ancho total. Cuando la primera copia termina
 * de salir por la izquierda, la segunda está justo donde estaba la
 * primera al empezar: la animación vuelve a cero y el salto no se ve.
 * Con una sola copia habría un hueco al final de cada vuelta.
 *
 * ── Lo que oye un lector de pantalla ──
 *
 * Una sola vez. La copia va con `aria-hidden`, porque si no, quien
 * navega a ciegas escucharía lo mismo el doble de veces sin entender por
 * qué.
 */

export function Marquesina({
  contenido,
  segundos,
  /**
   * Detener al pasar el cursor o al llegar con el tabulador.
   *
   * Imprescindible cuando lo que se desplaza se puede pulsar: intentar
   * hacer clic en algo que se está moviendo es de las cosas más molestas
   * que puede hacer una web. Para texto que solo se lee, sobra.
   */
  pausarAlTocar = false,
  className = "",
}: {
  contenido: React.ReactNode;
  segundos: number;
  pausarAlTocar?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`marquesina flex w-max ${
        pausarAlTocar ? "marquesina-pausable" : ""
      } ${className}`}
      style={{ ["--marquesina-dur" as string]: `${segundos}s` }}
    >
      <div className="flex shrink-0 items-center">{contenido}</div>
      <div className="flex shrink-0 items-center" aria-hidden="true">
        {contenido}
      </div>
    </div>
  );
}

/**
 * Cuántos segundos tarda una vuelta, a ritmo de lectura constante.
 *
 * Sale del ancho estimado y no de un número fijo: con duración fija, un
 * contenido corto pasa volando y uno largo se arrastra.
 */
export function duracionCinta(anchoAproximado: number, pixelesPorSegundo = 60) {
  return Math.max(12, Math.round(anchoAproximado / pixelesPorSegundo));
}
