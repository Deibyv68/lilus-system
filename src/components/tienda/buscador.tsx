"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { CapaPantalla } from "@/components/tienda/capa-pantalla";

/**
 * El buscador, a pantalla completa.
 *
 * Un solo campo en el centro y nada más. La página queda detrás, oscura:
 * no hay nada que hacer mientras se escribe salvo escribir.
 *
 * ── Busca de verdad ──
 *
 * Manda a `/tienda?q=…`, que filtra el catálogo. Un icono de lupa que no
 * busca es peor que no ponerlo: promete algo y no lo cumple.
 */
export function Buscador({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");

  useEffect(() => {
    if (!abierto) return;
    /*
      Al abrir, el cursor ya está dentro: nadie abre un buscador para
      después tener que tocar el campo.

      Directo, sin esperar. Antes hacía falta un retardo porque la capa se
      ocultaba con `visibility: hidden` y un elemento invisible no acepta
      el foco; ahora se oculta solo con opacidad, así que el campo ya es
      enfocable en el momento en que este efecto corre.
    */
    campo.current?.focus();
  }, [abierto]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = texto.trim();
    onCerrar();
    router.push(q ? `/tienda?q=${encodeURIComponent(q)}` : "/tienda");
  }

  return (
    <CapaPantalla abierta={abierto} onCerrar={onCerrar} etiqueta="Buscar">
      <div className="flex h-full flex-col">
        <div className="mx-auto flex w-full max-w-[1440px] justify-end px-6 py-5 sm:px-10">
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el buscador"
            className="-mr-3 p-3 text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:text-white"
          >
            <X className="size-7" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-1 items-start justify-center px-6 pt-16 sm:pt-24">
          <form
            onSubmit={onSubmit}
            role="search"
            className="capa-item w-full max-w-xl"
          >
            <label htmlFor="buscar-tienda" className="sr-only">
              Buscar en la tienda
            </label>

            <div className="flex items-center gap-3 rounded-full bg-white px-6 py-4">
              <Search
                className="size-5 shrink-0 text-stone-500"
                strokeWidth={2}
                aria-hidden="true"
              />
              <input
                ref={campo}
                id="buscar-tienda"
                type="search"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Busca tu jabón…"
                /*
                  16 px para que Safari en iOS no amplíe la página al
                  enfocar. Es el mismo motivo que en el checkout.
                */
                className="w-full bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>

            <p className="mt-4 text-center text-sm text-tienda-tenue">
              Escribe y pulsa Enter. También puedes{" "}
              <button
                type="submit"
                className="underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
              >
                ver todo el catálogo
              </button>
              .
            </p>
          </form>
        </div>
      </div>
    </CapaPantalla>
  );
}
