"use client";

import { Printer } from "lucide-react";

/**
 * El botón de imprimir.
 *
 * Existe como componente aparte solo porque `window.print()` necesita
 * navegador, y el recibo entero es una página de servidor. Mantenerlo
 * separado deja que todo lo demás —los datos, las cifras, el texto legal—
 * se arme en el servidor y llegue ya escrito.
 *
 * Y dice «Imprimir o guardar en PDF» a propósito: casi nadie lo va a
 * imprimir en papel, pero mucha gente no sabe que el mismo diálogo sirve
 * para guardar el archivo. Nombrarlo es la diferencia entre que lo usen y
 * que no.
 */
export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full border border-tienda-linea px-4 py-2 text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white"
    >
      <Printer className="size-4" />
      Imprimir o guardar en PDF
    </button>
  );
}
