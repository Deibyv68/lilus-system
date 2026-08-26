"use client";

/**
 * El carrito. Vive en el navegador de quien compra.
 *
 * Se guarda en localStorage para que no se pierda si cierra la pestaña y
 * vuelve mañana — que es exactamente lo que hace la gente: mira, lo piensa,
 * y vuelve.
 *
 * ── Lo que guarda, y lo que no ──
 *
 * Guarda el precio y el nombre, pero solo para poder pintar el carrito sin
 * ir al servidor en cada cambio. **Ese precio no vale para cobrar.** Está
 * en la máquina del cliente: se puede editar desde las herramientas del
 * navegador en diez segundos. Cuando se arma el pedido, el servidor vuelve
 * a leer los precios de la base y usa esos (ver `preciosVigentes` en
 * lib/tienda.ts). Lo único que se acepta del carrito es qué y cuántos.
 *
 * También significa que un precio guardado puede quedar viejo si cambia
 * mientras el carrito espera. Por eso el checkout muestra el total
 * recalculado antes de confirmar, y no el que trae el carrito.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TipoArticulo } from "./tienda";

export type LineaCarrito = {
  tipo: TipoArticulo;
  id: string;
  slug: string;
  nombre: string;
  /** Referencial: sirve para pintar, no para cobrar. */
  precio: number;
  imagen: string | null;
  cantidad: number;
};

/** Un artículo se identifica por su tipo y su id: un producto y un pack
 *  podrían compartir id sin que eso signifique nada. */
function clave(l: { tipo: TipoArticulo; id: string }) {
  return `${l.tipo}:${l.id}`;
}

type EstadoCarrito = {
  lineas: LineaCarrito[];
  /** Se vuelve true cuando localStorage terminó de cargar. */
  listo: boolean;
  marcarListo: () => void;
  agregar: (linea: Omit<LineaCarrito, "cantidad">, cantidad?: number) => void;
  /**
   * Suma (o resta) sobre lo que haya ahora.
   *
   * Los botones de más y menos van por acá y no por una cantidad absoluta
   * a propósito. Si el botón calculara `cantidad + 1` con el número que
   * recibió al pintarse, dos clics rápidos leerían los dos el mismo valor
   * viejo y el segundo no contaría: se toca dos veces y sube uno. Acá la
   * cuenta se hace adentro de `set`, sobre el estado del momento.
   */
  sumar: (ref: { tipo: TipoArticulo; id: string }, delta: number) => void;
  quitar: (ref: { tipo: TipoArticulo; id: string }) => void;
  vaciar: () => void;
};

const MAX_POR_LINEA = 99;

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      lineas: [],
      listo: false,
      marcarListo: () => set({ listo: true }),

      agregar: (linea, cantidad = 1) =>
        set((s) => {
          const k = clave(linea);
          const existente = s.lineas.find((l) => clave(l) === k);
          if (!existente) {
            return { lineas: [...s.lineas, { ...linea, cantidad }] };
          }
          return {
            lineas: s.lineas.map((l) =>
              clave(l) === k
                ? { ...l, cantidad: Math.min(l.cantidad + cantidad, MAX_POR_LINEA) }
                : l
            ),
          };
        }),

      sumar: (ref, delta) =>
        set((s) => {
          const k = clave(ref);
          const actual = s.lineas.find((l) => clave(l) === k);
          if (!actual) return s;

          const nueva = actual.cantidad + delta;
          // Bajar a cero es la forma natural de quitar algo: nadie busca el
          // botón de borrar si puede seguir tocando el menos.
          if (nueva <= 0) {
            return { lineas: s.lineas.filter((l) => clave(l) !== k) };
          }
          return {
            lineas: s.lineas.map((l) =>
              clave(l) === k
                ? { ...l, cantidad: Math.min(nueva, MAX_POR_LINEA) }
                : l
            ),
          };
        }),

      quitar: (ref) =>
        set((s) => ({ lineas: s.lineas.filter((l) => clave(l) !== clave(ref)) })),

      vaciar: () => set({ lineas: [] }),
    }),
    {
      name: "lilus-carrito",
      // Solo se guardan las líneas. `listo` describe el estado de esta
      // pestaña ahora mismo, no algo que tenga sentido recordar.
      partialize: (s) => ({ lineas: s.lineas }),
      // El servidor renderiza siempre un carrito vacío — no sabe lo que hay
      // guardado en el navegador. Si la interfaz pintara ese vacío como si
      // fuera cierto, React se quejaría de hidratación y el cliente vería
      // parpadear un carrito que no es el suyo. `listo` deja esperar ese
      // instante a propósito.
      onRehydrateStorage: () => (estado) => {
        estado?.marcarListo();
      },
    }
  )
);

export function totalUnidades(lineas: LineaCarrito[]): number {
  return lineas.reduce((n, l) => n + l.cantidad, 0);
}

export function subtotal(lineas: LineaCarrito[]): number {
  return lineas.reduce((n, l) => n + l.precio * l.cantidad, 0);
}
