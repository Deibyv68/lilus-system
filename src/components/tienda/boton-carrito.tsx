"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrito, totalUnidades } from "@/lib/carrito";

/**
 * El acceso al carrito, con el contador.
 *
 * El contador no se pinta hasta que el carrito terminó de leerse del
 * navegador. El servidor no sabe qué hay guardado ahí, así que manda un
 * cero; si lo mostráramos, quien vuelve con tres cosas adentro vería un
 * carrito vacío por un instante antes de que salte a tres. Ese parpadeo
 * se lee como que la tienda perdió el pedido.
 */
export function BotonCarrito() {
  const lineas = useCarrito((s) => s.lineas);
  const listo = useCarrito((s) => s.listo);
  const unidades = totalUnidades(lineas);

  return (
    <Link
      href="/carrito"
      className="relative flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm transition-colors hover:bg-stone-100"
    >
      <ShoppingBag className="size-4" />
      <span className="hidden sm:inline">Carrito</span>
      {listo && unidades > 0 && (
        <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-stone-900 text-stone-50 text-xs tabular-nums">
          {unidades}
        </span>
      )}
    </Link>
  );
}
