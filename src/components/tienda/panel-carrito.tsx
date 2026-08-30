"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCarrito, subtotal, totalUnidades } from "@/lib/carrito";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";

/**
 * El carrito como panel lateral.
 *
 * Entra desde la derecha sin sacar a nadie de donde estaba. En una tienda
 * eso importa: la mayoría de las veces se abre el carrito para comprobar
 * qué hay dentro, no para pagar, y llevarse a la persona a otra página
 * para eso la obliga a volver sobre sus pasos.
 *
 * Pero el panel no reemplaza a la página. `/carrito` sigue existiendo y
 * hay un enlace claro hacia ella: es donde se edita con calma, y es la
 * dirección que alguien puede guardar o compartir. El panel es el vistazo;
 * la página es el sitio.
 *
 * ── Lo que hace falta para que un panel así no estorbe ──
 *
 * Escape lo cierra, el foco entra al abrirlo y vuelve al botón al
 * cerrarlo, y el fondo no se desplaza por debajo. Sin eso, quien navega
 * con teclado queda atrapado detrás del panel, y en móvil el fondo se
 * mueve mientras uno cree estar desplazando el carrito.
 */
export function PanelCarrito({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const { lineas, listo, sumar, quitar } = useCarrito();
  const panel = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);
  /*
    `onCerrar` NO puede estar entre las dependencias del efecto.

    Llega como una flecha escrita en el JSX de la cabecera, así que es una
    función distinta en cada render — y la cabecera se vuelve a pintar
    cada vez que cambia el carrito. Con `onCerrar` en las dependencias, el
    efecto se desmontaba y se volvía a montar EN CADA TOQUE al «+» o al
    «−»: soltaba el bloqueo del desplazamiento y lo volvía a poner, y de
    paso movía el foco al botón de cerrar. Mover el foco arrastra la
    vista, así que la lista del carrito saltaba arriba sola cada vez que
    se cambiaba una cantidad. Eso es lo que se veía roto en el teléfono.

    Guardada en una referencia, el efecto se monta una sola vez —al
    abrir— y sigue llamando a la última versión.
  */
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  });


  useEffect(() => {
    if (!abierto) return;

    focoPrevio.current = document.activeElement as HTMLElement;
    /*
      `preventScroll` NO es un detalle: es el fallo del despliegue.

      Al abrir, el panel todavía está apartado a la derecha, fuera del
      envoltorio que lo recorta. Enfocar el botón de cerrar hacía que el
      navegador desplazara ese envoltorio para «traer a la vista» lo
      enfocado —medido: `scrollLeft` saltaba a 345 en un teléfono de 375—
      y con ello se corría hacia la izquierda TODO lo de dentro. El panel
      entraba, sí, pero 345 px más allá de donde va; y al terminar el
      recorrido ya no sobraba nada que desplazar, el navegador devolvía el
      desplazamiento a cero y el panel daba el tirón de vuelta a su sitio.

      Eso era «se despliega de más y luego regresa». El foco tiene que
      ponerse sin mover nada.
    */
    cerrarRef.current?.focus({ preventScroll: true });

    // El fondo no se mueve mientras el panel está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPulsar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        cerrar.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;

      // Encierra el tabulador dentro del panel: si no, el foco se va a los
      // enlaces de detrás, que están tapados y no se ven.
      const focos = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focos.length === 0) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus({ preventScroll: true });
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus({ preventScroll: true });
      }
    }

    document.addEventListener("keydown", alPulsar);
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = overflowPrevio;
      focoPrevio.current?.focus({ preventScroll: true });
    };
  }, [abierto]);

  const total = subtotal(lineas);
  const unidades = totalUnidades(lineas);
  const vacio = listo && lineas.length === 0;

  return (
    /*
      El envoltorio fijo con `overflow-hidden` NO es decorativo: es lo que
      arregla que la pagina se moviera de lado en el telefono.
      
      Antes el panel era `fixed` y se escondia con translate hacia la
      derecha, o sea que quedaba tumbado en x=375..750 de una pantalla de
      375. Un elemento fijo no deberia ensanchar la pagina, pero en la
      practica lo hacia: medido, el ancho desplazable pasaba de 375 a 750,
      y toda la tienda se podia arrastrar de lado con el dedo.
      
      Ahora el panel es `absolute` dentro de este envoltorio, y el
      `overflow-hidden` del envoltorio si lo recorta. Cerrado no ocupa
      nada y no deja pasar toques.
    */
    <div
      /*
        `overflow-clip` y no `overflow-hidden`.

        Los dos recortan igual, pero `hidden` deja el elemento
        DESPLAZABLE por programa —tiene `scrollLeft`, aunque no se vea
        barra— y eso es lo que el navegador aprovechaba para correrlo
        entero al enfocar algo que asomaba fuera. `clip` recorta y ya: no
        hay desplazamiento que mover, así que el fallo no puede volver
        por otra puerta.
      */
      className={`fixed inset-0 z-50 overflow-clip ${
        abierto ? "" : "pointer-events-none"
      }`}
    >
      {/*
        El velo se pinta siempre y se desvanece, en vez de aparecer y
        desaparecer del árbol: así la transición tiene de dónde salir y
        hacia dónde volver.
      */}
      <div
        onClick={onCerrar}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out ${
          abierto ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-carrito"
        /*
          `inert` cuando está cerrado: lo saca del orden de tabulación y de
          los lectores de pantalla sin quitarlo del árbol, que es lo que
          permite que se deslice al abrirse. Va como booleano — pasarlo
          como cadena vacía no lo aplica.
        */
        inert={!abierto}
        /*
          Entra desde la derecha y punto: 300 ms con una desaceleración
          normal, el mismo ritmo que el velo.
          
          Pasó por dos versiones peores. La primera usaba el muelle, que se
          pasa un 4,6 % antes de volver — en un panel pegado a un borde eso
          son 17 px MÁS ALLÁ del borde, con la página asomando por detrás.
          La segunda ya no se pasaba, pero iba a 520 ms mientras el velo
          iba a 400: dos cosas que entran juntas a ritmos distintos se
          leen como un tirón aunque cada una por separado esté bien.
          
          Aquí lo que se pide es que aparezca, no que haga una entrada.
        */
        /*
          En el teléfono NO ocupa todo el ancho, y eso es lo que hace que
          la entrada se entienda.

          Ocupando el 100 %, lo que se veía era un rectángulo casi negro
          entrando sobre una página casi negra: sin borde, sin sombra y
          sin nada del sitio asomando, no se leía como un panel que llega
          — se leía como si el contenido saltara solo. El velo estaba
          ahí, pero tapado por el propio panel, así que no servía de nada.

          Dejando una franja de la tienda a la vista y oscurecida, más el
          borde y la sombra del canto, el movimiento tiene de dónde salir
          y contra qué medirse. Y esa franja es además el sitio donde
          todo el mundo toca para cerrar.

          En pantalla grande no cambia nada: el 92 % de 1280 pasa de
          sobra los 520 px del tope.
        */
        className={`absolute right-0 top-0 flex h-full w-[92%] max-w-[520px] flex-col
          border-l border-tienda-linea bg-tienda-fondo-alt
          shadow-[-24px_0_60px_-16px_rgba(0,0,0,0.75)]
          transition-transform duration-300 ease-out
          ${abierto ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-start justify-between px-8 pt-8 sm:px-10">
          <h2
            id="titulo-carrito"
            className="font-display text-5xl leading-none tracking-[-0.01em] text-white"
          >
            Carrito
          </h2>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el carrito"
            className="-mr-2 -mt-1 p-2 text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            <X className="size-7" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-8 py-8 sm:px-10">
          {!listo ? null : vacio ? (
            <Vacio onCerrar={onCerrar} />
          ) : (
            <ul className="space-y-6">
              {lineas.map((l) => (
                <li key={`${l.tipo}:${l.id}`} className="flex gap-4">
                  <Link
                    href={`/tienda/${l.slug}`}
                    onClick={onCerrar}
                    className="relative size-20 shrink-0 overflow-hidden rounded-tienda-sm bg-tienda-velo"
                  >
                    <ImagenArticulo url={l.imagen} alt={null} nombre={l.nombre} />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/tienda/${l.slug}`}
                        onClick={onCerrar}
                        className="inline-block py-1 leading-snug text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:text-white"
                      >
                        {l.nombre}
                      </Link>
                      <button
                        type="button"
                        onClick={() => quitar(l)}
                        aria-label={`Quitar ${l.nombre} del carrito`}
                        className="-mr-2 -mt-2 shrink-0 p-3 text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <Cantidad
                        valor={l.cantidad}
                        nombre={l.nombre}
                        onDelta={(d) => sumar(l, d)}
                      />
                      <span className="tabular-nums text-tienda-texto">
                        {formatCurrency(l.precio * l.cantidad)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-tienda-linea px-8 py-8 sm:px-10">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-tienda-tenue">Subtotal</span>
            <span className="text-2xl tabular-nums text-white">
              {formatCurrency(total)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-tienda-tenue">
            El envío se calcula al finalizar el pedido, según la zona.
          </p>

          <Link
            href="/checkout"
            onClick={onCerrar}
            aria-disabled={vacio}
            tabIndex={vacio ? -1 : undefined}
            className={`mt-6 block rounded-full px-8 py-4 text-center text-sm font-medium transition-[background-color,transform] duration-[400ms] ease-tienda ${
              vacio
                ? "pointer-events-none bg-tienda-velo text-tienda-tenue"
                : "bg-tienda-texto text-tienda-fondo hover:bg-tienda-acento active:scale-[0.97] active:duration-100 active:ease-tienda-tap"
            }`}
          >
            Continuar con el pedido
          </Link>

          {/*
            La salida a la página del carrito. Es lo que pidió el diseño:
            el panel para mirar, la página para trabajar con calma — y una
            dirección que se puede guardar.
          */}
          <Link
            href="/carrito"
            onClick={onCerrar}
            className="mt-3 block py-2 text-center text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
          >
            {unidades > 0
              ? `Ver el carrito completo (${unidades})`
              : "Ver el carrito completo"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Vacio({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="grid size-32 place-items-center rounded-full bg-tienda-velo">
        <ShoppingBag className="size-12 text-tienda-tenue" strokeWidth={1.25} />
      </div>
      <p className="mt-8 text-lg text-tienda-texto">Tu carrito está vacío</p>
      <Link
        href="/tienda"
        onClick={onCerrar}
        className="mt-3 inline-block py-2 text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
      >
        Ver el catálogo
      </Link>
    </div>
  );
}

function Cantidad({
  valor,
  nombre,
  onDelta,
}: {
  valor: number;
  nombre: string;
  /** Cuánto sumar o restar. La cuenta la hace el carrito, no este botón. */
  onDelta: (delta: number) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-tienda-linea">
      <button
        type="button"
        onClick={() => onDelta(-1)}
        aria-label={`Quitar uno de ${nombre}`}
        className="grid size-11 place-items-center rounded-full transition-colors duration-[400ms] ease-tienda hover:text-white"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
        {valor}
      </span>
      <button
        type="button"
        onClick={() => onDelta(1)}
        aria-label={`Agregar uno de ${nombre}`}
        className="grid size-11 place-items-center rounded-full transition-colors duration-[400ms] ease-tienda hover:text-white"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
