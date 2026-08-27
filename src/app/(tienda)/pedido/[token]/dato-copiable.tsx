"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Un dato con su botón de copiar.
 *
 * ── Por qué uno por dato y no un botón para todo ──
 *
 * Quien va a transferir tiene delante el formulario de su banco: el
 * número de cuenta va en un campo, el nombre en otro, la cédula en otro y
 * el monto en otro. Copiar el bloque entero obliga a pegar, borrar lo que
 * sobra, y repetir cinco veces — y es exactamente ahí donde se cuela un
 * dígito de menos en el número de cuenta.
 *
 * Con un botón por dato, cada pegado es limpio.
 *
 * ── Sobre el acuse ──
 *
 * El botón cambia a una marca durante dos segundos. Sin eso no hay forma
 * de saber si el toque funcionó: el portapapeles es invisible, y quien no
 * está seguro copia otra vez, o peor, se va al banco a pegar algo que no
 * copió.
 */
export function DatoCopiable({
  etiqueta,
  valor,
  destacado = false,
  ayuda,
}: {
  etiqueta: string;
  valor: string;
  /** Para el monto y el número de pedido, que son los que más se equivocan. */
  destacado?: boolean;
  ayuda?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /*
        El portapapeles falla sin permiso o fuera de HTTPS. En vez de un
        error que no se puede arreglar desde ahí, se selecciona el texto:
        así se puede copiar a mano con el gesto de siempre.
      */
      const nodo = document.getElementById(`dato-${etiqueta}`);
      if (nodo) {
        const rango = document.createRange();
        rango.selectNodeContents(nodo);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(rango);
      }
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-tienda-linea py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-tienda-tenue">
          {etiqueta}
        </p>
        <p
          id={`dato-${etiqueta}`}
          className={`mt-0.5 break-words ${
            destacado
              ? "font-display text-2xl leading-tight text-white"
              : "text-sm text-tienda-texto"
          }`}
        >
          {valor}
        </p>
        {ayuda && (
          <p className="mt-0.5 text-xs text-tienda-tenue">{ayuda}</p>
        )}
      </div>

      <button
        type="button"
        onClick={copiar}
        /*
          44 px de lado: es el mínimo cómodo para un dedo, y esta pantalla
          se usa casi siempre en el teléfono, saltando entre la app del
          banco y aquí.
        */
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-tienda-linea transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto active:scale-95"
        aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
      >
        {copiado ? (
          <Check className="size-4 text-tienda-acento" />
        ) : (
          <Copy className="size-4 text-tienda-tenue" />
        )}
      </button>
    </div>
  );
}
