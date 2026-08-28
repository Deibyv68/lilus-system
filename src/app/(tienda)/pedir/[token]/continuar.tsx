"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useCarrito, type LineaCarrito } from "@/lib/carrito";

/**
 * Pasar del enlace al checkout de siempre.
 *
 * ── Qué hace exactamente ──
 *
 * Deja en el carrito lo que se acordó y lleva al checkout. A partir de
 * ahí no hay nada especial: es la misma pantalla que usa cualquiera que
 * compre por la web, con sus validaciones y su mapa.
 *
 * ── El aviso antes de reemplazar ──
 *
 * Continuar borra lo que la persona tuviera en su carrito. Casi siempre
 * está vacío —abre el enlace desde WhatsApp, no venía navegando— pero
 * cuando no lo está, borrárselo sin decir nada es hacerle perder algo
 * suyo. Se avisa y se deja decidir.
 */
export function Continuar({
  token,
  lineas,
}: {
  token: string;
  lineas: LineaCarrito[];
}) {
  const router = useRouter();
  const { lineas: enElCarrito, listo, vaciar, agregar } = useCarrito();
  const [confirmandoReemplazo, setConfirmandoReemplazo] = useState(false);

  /*
    Se compara contra lo que ya hay, no contra «hay algo».

    Si alguien abre el enlace dos veces, la segunda vez su carrito ya
    tiene exactamente lo del enlace: avisarle de que va a perder algo
    sería mentira, y encima daría miedo justo antes de comprar.
  */
  const hayOtraCosa =
    listo &&
    enElCarrito.length > 0 &&
    JSON.stringify(enElCarrito.map((l) => `${l.tipo}:${l.id}:${l.cantidad}`).sort()) !==
      JSON.stringify(lineas.map((l) => `${l.tipo}:${l.id}:${l.cantidad}`).sort());

  function seguir() {
    if (lineas.length > 0) {
      vaciar();
      for (const l of lineas) agregar(l, l.cantidad);
    }
    /*
      El token viaja al checkout para que el pedido quede atado al enlace.

      Va en la dirección y no en el carrito: el carrito sobrevive a
      cerrar el navegador, y un token viejo pegado ahí ataría al enlace
      una compra de la semana que viene.
    */
    router.push(
      lineas.length > 0
        ? `/checkout?p=${encodeURIComponent(token)}`
        : `/tienda?p=${encodeURIComponent(token)}`
    );
  }

  const texto = lineas.length > 0 ? "Continuar con mis datos" : "Ver el catálogo";

  if (hayOtraCosa && !confirmandoReemplazo) {
    return (
      <div className="space-y-4">
        <p className="rounded-tienda-sm border border-tienda-linea px-4 py-3 text-sm leading-relaxed text-tienda-tenue">
          Ya tenías cosas en tu carrito. Si sigues, se reemplazan por lo que
          apartamos para ti.
        </p>
        <button
          type="button"
          onClick={() => {
            setConfirmandoReemplazo(true);
            seguir();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-tienda-texto px-6 py-4 text-sm font-medium text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-acento active:scale-[0.99]"
        >
          Reemplazar y continuar
          <ArrowRight className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={seguir}
      disabled={!listo}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-tienda-texto px-6 py-4 text-sm font-medium text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-acento active:scale-[0.99] disabled:opacity-60"
    >
      {texto}
      <ArrowRight className="size-4" />
    </button>
  );
}
