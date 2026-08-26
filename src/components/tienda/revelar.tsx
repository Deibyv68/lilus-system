"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Aparecer al entrar en pantalla.
 *
 * Es el gesto que define la plantilla de referencia, y su gracia está en
 * lo poco que se mueve: **diez píxeles**. La mayoría de las plantillas
 * desplazan cuarenta o sesenta y el resultado se siente barato, como si
 * la página estuviera armándose delante de uno. Diez píxeles no se leen
 * como movimiento; se leen como que la página respira.
 *
 * Los valores están medidos del sitio original, no aproximados:
 * opacidad 0 → 1 y translateY(10px) → 0, en 400 ms con la curva
 * cubic-bezier(0.44, 0, 0.56, 1).
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
export function Revelar({
  children,
  /** Milisegundos de espera. Para escalonar una fila de tarjetas. */
  retardo = 0,
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
      style={retardo ? { transitionDelay: `${retardo}ms` } : undefined}
      className={`revelar ${className}`}
    >
      {children}
    </Etiqueta>
  );
}
