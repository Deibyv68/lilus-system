import { Marquesina, duracionCinta } from "@/components/tienda/marquesina";

/**
 * La frase enorme que cruza la pantalla en el cierre.
 *
 * Es puro tono: no informa nada que no esté dicho antes. Cumple una
 * función real de todos modos — le pone un final a la página. Sin algo
 * así, el contenido termina y aparece el pie de golpe, y se siente como
 * si la página se hubiera cortado.
 *
 * No se pausa al pasar el cursor porque no hay nada que pulsar: pausar
 * algo que solo se lee no ayuda a nadie.
 */

/** Ancho aproximado de un carácter a este tamaño de letra. */
const ANCHO_CARACTER = 40;

export function CintaTexto({ texto }: { texto: string }) {
  const segundos = duracionCinta(texto.length * ANCHO_CARACTER * 2, 90);

  const contenido = (
    <>
      {[0, 1].map((i) => (
        <span
          key={i}
          className="whitespace-nowrap px-8 font-display text-6xl leading-none tracking-[-0.01em] text-white sm:text-8xl"
        >
          {texto}
        </span>
      ))}
    </>
  );

  return (
    <div className="overflow-hidden py-16 sm:py-24">
      <Marquesina contenido={contenido} segundos={segundos} />
    </div>
  );
}
