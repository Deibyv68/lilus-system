"use client";

import { useEffect, useRef } from "react";

/**
 * El armazón de las capas a pantalla completa: el menú y el buscador.
 *
 * Las dos hacen lo mismo por debajo —tapar la página, atrapar el teclado,
 * cerrarse con Escape— y solo cambia lo que llevan dentro. Tenerlo aquí
 * evita que una de las dos se quede sin alguna de esas piezas, que es lo
 * que pasa siempre cuando se copian.
 *
 * ── Por qué no reutiliza el panel del carrito ──
 *
 * Porque son gestos distintos: el carrito entra desde un lado y deja ver
 * la página detrás, porque uno sigue comprando. Estas dos tapan todo: son
 * un cambio de contexto, no un vistazo.
 */
export function CapaPantalla({
  abierta,
  onCerrar,
  etiqueta,
  children,
}: {
  abierta: boolean;
  onCerrar: () => void;
  /** Qué es esta capa, para quien no la ve. */
  etiqueta: string;
  children: React.ReactNode;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const focoPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierta) return;

    focoPrevio.current = document.activeElement as HTMLElement;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPulsar(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCerrar();
        return;
      }
      if (e.key !== "Tab" || !caja.current) return;

      // Encierra el tabulador: si no, el foco se va a los enlaces de la
      // página tapada, que están debajo y no se ven.
      const focos = caja.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (focos.length === 0) return;
      const primero = focos[0];
      const ultimo = focos[focos.length - 1];

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPulsar);
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = overflowPrevio;
      focoPrevio.current?.focus();
    };
  }, [abierta, onCerrar]);

  return (
    <div
      ref={caja}
      role="dialog"
      aria-modal="true"
      aria-label={etiqueta}
      inert={!abierta}
      /*
        Se queda en el árbol y se desvanece, en vez de montarse y
        desmontarse: así la salida también se ve. Cerrada no recibe toques
        ni tabulador.
      */
      className={`capa-pantalla fixed inset-0 z-[60] bg-tienda-fondo ${
        abierta ? "capa-abierta" : "pointer-events-none"
      }`}
    >
      {children}
    </div>
  );
}
