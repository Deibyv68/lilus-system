"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarMiPedidoAction } from "./actions";

/**
 * El formulario de «dónde está mi pedido».
 *
 * Dos campos y nada más. Cada campo de más es gente que se va: quien
 * llega acá ya está preocupada por su compra y no viene a llenar una
 * ficha.
 */
export function BuscadorDePedido() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [buscando, startBusqueda] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startBusqueda(async () => {
      const r = await buscarMiPedidoAction(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(`/pedido/${r.token}`);
    });
  }

  return (
    <form action={onSubmit} className="mt-12 max-w-md">
      <div className="space-y-6">
        <div>
          <label
            htmlFor="numero"
            className="block text-xs uppercase tracking-wide text-tienda-tenue"
          >
            Número de pedido
          </label>
          {/*
            `text-base` en móvil y no `text-sm`: por debajo de 16px, iOS
            hace zoom al tocar el campo y deja la página torcida.
          */}
          <input
            id="numero"
            name="numero"
            required
            autoComplete="off"
            placeholder="LILUS-000007"
            className="mt-2 w-full border-b border-tienda-linea bg-transparent pb-2 text-base text-tienda-texto placeholder:text-tienda-tenue/50 focus:border-tienda-texto focus:outline-none sm:text-sm"
          />
          <p className="mt-2 text-xs text-tienda-tenue">
            Está en el correo y en el mensaje de WhatsApp que te mandamos.
          </p>
        </div>

        <div>
          <label
            htmlFor="contacto"
            className="block text-xs uppercase tracking-wide text-tienda-tenue"
          >
            Tu correo o tu teléfono
          </label>
          <input
            id="contacto"
            name="contacto"
            required
            autoComplete="off"
            placeholder="maria@correo.com"
            className="mt-2 w-full border-b border-tienda-linea bg-transparent pb-2 text-base text-tienda-texto placeholder:text-tienda-tenue/50 focus:border-tienda-texto focus:outline-none sm:text-sm"
          />
          <p className="mt-2 text-xs text-tienda-tenue">
            El mismo con el que hiciste la compra.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt px-4 py-3 text-sm leading-relaxed text-tienda-texto"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={buscando}
        className="mt-8 w-full rounded-full bg-tienda-texto px-6 py-4 text-sm font-medium text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-acento active:scale-[0.98] active:duration-100 disabled:opacity-60"
      >
        {buscando ? "Buscando…" : "Ver mi pedido"}
      </button>
    </form>
  );
}
