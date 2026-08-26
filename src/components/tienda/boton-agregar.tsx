"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { useCarrito } from "@/lib/carrito";
import type { ArticuloResumen } from "@/lib/tienda";

/**
 * Agrega al carrito y lo dice.
 *
 * No manda a nadie al carrito ni abre un panel encima. En una tienda de
 * jabones lo normal es llevar cuatro o cinco cosas, y sacar a la persona
 * del catálogo en cada una la obliga a volver sobre sus pasos una y otra
 * vez. El botón confirma en el sitio y la deja donde estaba.
 */
export function BotonAgregar({
  articulo,
  className = "",
}: {
  articulo: ArticuloResumen;
  className?: string;
}) {
  const agregar = useCarrito((s) => s.agregar);
  const [agregado, setAgregado] = useState(false);

  function onClick() {
    agregar({
      tipo: articulo.tipo,
      id: articulo.id,
      slug: articulo.slug,
      nombre: articulo.nombre,
      precio: articulo.precio,
      imagen: articulo.imagen,
    });

    // La confirmación se apaga sola. Si el mismo botón se toca de nuevo
    // antes de que pase, el temporizador vuelve a empezar y no se acumulan.
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Agregar ${articulo.nombre} al carrito`}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
        agregado
          ? "bg-emerald-700 text-white"
          : "bg-stone-900 text-stone-50 hover:bg-stone-700"
      } ${className}`}
    >
      {agregado ? (
        <>
          <Check className="size-4" />
          Agregado
        </>
      ) : (
        <>
          <Plus className="size-4" />
          Agregar
        </>
      )}
    </button>
  );
}
