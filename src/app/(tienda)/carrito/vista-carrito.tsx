"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCarrito, subtotal } from "@/lib/carrito";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";

/**
 * El carrito.
 *
 * Es cliente entero porque el carrito vive en el navegador: el servidor no
 * sabe qué hay adentro y no tiene nada que aportar hasta el checkout.
 *
 * El envío se muestra como pendiente, no como cero. Poner "$0.00" antes de
 * saber la zona hace que el total parezca definitivo y después suba, que es
 * la manera más rápida de perder a alguien en el último paso.
 */
export function VistaCarrito() {
  const { lineas, listo, sumar, quitar } = useCarrito();

  // Mientras se lee localStorage no se pinta nada: ver "tu carrito está
  // vacío" y que un instante después aparezcan tres cosas es peor que
  // esperar ese instante.
  if (!listo) {
    return <Marco><div className="h-48" /></Marco>;
  }

  if (lineas.length === 0) {
    return (
      <Marco>
        <p className="text-stone-600">Tu carrito está vacío.</p>
        <Link
          href="/tienda"
          className="mt-6 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
        >
          Ver el catálogo
        </Link>
      </Marco>
    );
  }

  const total = subtotal(lineas);

  return (
    <Marco>
      <ul className="divide-y divide-stone-200 border-y border-stone-200">
        {lineas.map((l) => (
          <li key={`${l.tipo}:${l.id}`} className="flex gap-4 py-5">
            <Link
              href={`/tienda/${l.slug}`}
              className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-stone-100"
            >
              <ImagenArticulo url={l.imagen} alt={null} nombre={l.nombre} />
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/tienda/${l.slug}`}
                  className="font-medium leading-snug hover:underline underline-offset-4"
                >
                  {l.nombre}
                </Link>
                <button
                  type="button"
                  onClick={() => quitar(l)}
                  aria-label={`Quitar ${l.nombre} del carrito`}
                  className="shrink-0 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="mt-0.5 text-sm text-stone-500 tabular-nums">
                {formatCurrency(l.precio)} c/u
              </p>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Cantidad
                  valor={l.cantidad}
                  nombre={l.nombre}
                  onDelta={(d) => sumar(l, d)}
                />
                <span className="tabular-nums font-medium">
                  {formatCurrency(l.precio * l.cantidad)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2 text-sm">
        <Fila etiqueta="Subtotal" valor={formatCurrency(total)} />
        <Fila etiqueta="Envío" valor="Se calcula en el siguiente paso" tenue />
      </div>

      <Link
        href="/checkout"
        className="mt-7 block rounded-full bg-stone-900 px-5 py-3 text-center text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
      >
        Continuar con el pedido
      </Link>

      <p className="mt-4 text-center text-xs text-stone-500">
        El pago es por transferencia bancaria. Te damos los datos al final.
      </p>
    </Marco>
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
    <div className="flex items-center rounded-full border border-stone-300">
      <button
        type="button"
        onClick={() => onDelta(-1)}
        aria-label={`Quitar uno de ${nombre}`}
        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-stone-100"
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
        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-stone-100"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function Fila({
  etiqueta,
  valor,
  tenue = false,
}: {
  etiqueta: string;
  valor: string;
  tenue?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-500">{etiqueta}</span>
      <span className={tenue ? "text-stone-500" : "tabular-nums"}>{valor}</span>
    </div>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-tight">Tu carrito</h1>
      {children}
    </div>
  );
}
