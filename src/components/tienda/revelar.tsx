"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aparecer al entrar en pantalla.
 *
 * Los valores están medidos del sitio original, no aproximados.
 *
 * ── Lo que hace que se sienta como la referencia ──
 *
 * No es la distancia, es el muelle. La primera versión de esto usaba una
 * curva bezier simétrica y no se parecía: un bezier llega al destino y
 * frena en seco. La referencia usa un muelle físico (bounce .3) que pasa
 * un 4,6 % de largo y vuelve. Esa vuelta es lo que se lee como calidad.
 *
 * ── Las variantes ──
 *
 * La referencia no anima todo igual, y por eso una sola variante se veía
 * pobre. Hay tres gestos distintos, cada uno para su sitio:
 *
 *   subir     opacidad + 10 px hacia arriba. El más frecuente.
 *   enfocar   además desenfoca 10 px y va enfocando. Para títulos.
 *   inclinar  entra girada 3° desde abajo-izquierda
 *
 * ⚠ Las inclinadas se salen de su caja mientras esperan ocultas: se
 * desplazan hasta 30 px y giran. En un elemento pegado al borde de la
 * página eso ensancha el documento y aparece barra horizontal. Para
 * esos, usar `subir` o `enfocar`.. Para tarjetas.
 *
 * ── Que no desaparezca el contenido ──
 *
 * El estado inicial es invisible, así que si el JavaScript no corre, la
 * página se quedaría en blanco. Por eso el `<noscript>` del layout
 * revela todo de golpe: sin JS no hay animación, pero hay tienda.
 *
 * Y quien tenga activado «reducir movimiento» en su sistema ve el
 * contenido directamente. No es un adorno de accesibilidad: hay gente a
 * la que el movimiento en pantalla le produce mareo de verdad.
 */
export type VarianteRevelar =
  | "subir"
  | "enfocar"
  | "inclinar"
  | "inclinar-derecha";

export function Revelar({
  children,
  /** Milisegundos de espera. Para escalonar una fila de tarjetas. */
  retardo = 0,
  variante = "subir",
  className = "",
  /*
    Qué etiqueta se pinta. No es cosmético: una tarjeta dentro de una
    lista tiene que ser un <li>, o el HTML queda inválido y los lectores
    de pantalla dejan de anunciar «lista de 21 elementos».
  */
  as = "div",
}: {
  children: React.ReactNode;
  retardo?: number;
  variante?: VarianteRevelar;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const Etiqueta = as as React.ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Navegador sin IntersectionObserver: se muestra y ya. Perder la
    // animación es aceptable; perder el contenido no.
    //
    // Va en un timeout y no directo porque cambiar el estado en el cuerpo
    // del efecto provoca un segundo render antes de pintar. Así entra por
    // el mismo camino que el observador, que también avisa después.
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }

    // Si ya está en pantalla al cargar (la portada), se revela sin
    // esperar a que el observador dispare.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        setVisible(true);
        // Una sola vez. Que las cosas se desvanezcan al subir es
        // desconcertante: ya las viste, no tienen por qué irse.
        observador.disconnect();
      },
      // Se dispara un poco antes de que asome del todo, para que el
      // movimiento termine cuando el elemento ya se está leyendo.
      { rootMargin: "0px 0px -80px 0px", threshold: 0.01 }
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Etiqueta
      ref={ref}
      data-revelar={visible ? "si" : "no"}
      data-variante={variante}
      style={retardo ? { transitionDelay: `${retardo}ms` } : undefined}
      className={`revelar ${className}`}
    >
      {children}
    </Etiqueta>
  );
}
