"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { CapaPantalla } from "@/components/tienda/capa-pantalla";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { formatCurrency } from "@/lib/format";
import { listarParaBuscar } from "@/app/(tienda)/acciones-buscar";
import { filtrar, terminos, porQueCoincide } from "@/lib/buscar";

/**
 * El buscador, a pantalla completa y con resultados según se escribe.
 *
 * ── Por qué filtra en el navegador ──
 *
 * El catálogo entero se trae UNA vez, al abrir, y a partir de ahí cada
 * letra filtra en memoria. Con treinta artículos eso da resultados en el
 * mismo fotograma: no hay espera, ni parpadeo, ni resultados de una
 * búsqueda vieja llegando tarde y pisando a los de la nueva — que es el
 * fallo clásico de consultar al servidor en cada tecla.
 *
 * Con un catálogo de miles habría que hacerlo al revés. Con este, ir al
 * servidor sería más lento y más frágil.
 */

type Articulo = {
  tipo: "producto" | "pack";
  slug: string;
  nombre: string;
  tagline: string | null;
  precio: number;
  imagen: string | null;
  ingredientes: string | null;
};

const MAX_RESULTADOS = 6;

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
  const [catalogo, setCatalogo] = useState<Articulo[] | null>(null);

  useEffect(() => {
    if (!abierto) return;
    /*
      El cursor ya está dentro al abrir: nadie abre un buscador para
      después tener que tocar el campo. Directo, sin esperar — la capa se
      oculta con opacidad y no con `visibility`, así que el campo ya
      acepta el foco cuando este efecto corre.
    */
    campo.current?.focus({ preventScroll: true });
  }, [abierto]);

  useEffect(() => {
    // Una sola vez, y solo si alguien llega a abrirlo: quien nunca usa el
    // buscador no descarga el catálogo.
    if (!abierto || catalogo) return;
    let vigente = true;
    listarParaBuscar().then((lista) => {
      if (vigente) setCatalogo(lista);
    });
    return () => {
      vigente = false;
    };
  }, [abierto, catalogo]);

  const consulta = texto.trim();
  const buscando = terminos(consulta).length > 0;

  const resultados =
    !buscando || !catalogo ? [] : filtrar(catalogo, consulta).slice(0, MAX_RESULTADOS);
  const sinResultados = buscando && catalogo !== null && resultados.length === 0;

  function irAlCatalogo() {
    onCerrar();
    router.push(consulta ? `/tienda?q=${encodeURIComponent(consulta)}` : "/tienda");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Enter con un solo resultado va directo ahí: es lo que se espera
    // cuando ya solo queda una cosa en pantalla.
    if (resultados.length === 1) {
      const unico = resultados[0];
      onCerrar();
      router.push(
        unico.tipo === "pack" ? `/packs/${unico.slug}` : `/tienda/${unico.slug}`
      );
      return;
    }
    irAlCatalogo();
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

        <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pb-12 pt-8 sm:pt-16">
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
                autoComplete="off"
                /*
                  16 px para que Safari en iOS no amplíe la página al
                  enfocar. Mismo motivo que en el checkout.
                */
                className="w-full bg-transparent text-base text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </form>

          {/*
            Sin esto, quien no ve la lista no se entera de que escribir
            cambió lo que hay debajo.
          */}
          <p aria-live="polite" className="sr-only">
            {buscando
              ? `${resultados.length} resultado${resultados.length === 1 ? "" : "s"}`
              : ""}
          </p>

          <div className="mt-8 w-full max-w-xl">
            {sinResultados && (
              <p className="resultado text-center text-sm text-tienda-tenue">
                Nada con esa palabra. Prueba con el nombre del jabón o del
                ingrediente.
              </p>
            )}

            {resultados.length > 0 && (
              <ul className="space-y-2">
                {resultados.map((a, i) => (
                  <li
                    key={`${a.tipo}:${a.slug}`}
                    className="resultado"
                    style={{ ["--retardo" as string]: `${i * 45}ms` }}
                  >
                    <Link
                      href={
                        a.tipo === "pack"
                          ? `/packs/${a.slug}`
                          : `/tienda/${a.slug}`
                      }
                      onClick={onCerrar}
                      className="group flex items-center gap-4 rounded-tienda-sm border border-transparent p-3 transition-colors duration-200 ease-out hover:border-tienda-linea hover:bg-tienda-fondo-alt"
                    >
                      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-tienda-velo">
                        <ImagenArticulo
                          url={a.imagen}
                          alt={null}
                          nombre={a.nombre}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-tienda-texto transition-colors duration-200 ease-out group-hover:text-white">
                          {a.nombre}
                        </span>
                        {/*
                          Cuando el nombre no explica por qué salió, se
                          enseña el ingrediente que sí.

                          Buscar «romero» y ver aparecer el «Jabón de
                          Manzanilla» es correcto —lo lleva— pero sin
                          decirlo parece que el buscador se equivocó, y a
                          la segunda vez ya nadie se fía de él. Con la
                          línea debajo, el resultado raro pasa a ser el
                          hallazgo que se buscaba.
                        */}
                        {(() => {
                          const porQue = porQueCoincide(a, consulta);
                          return porQue ? (
                            <span className="block truncate text-sm text-tienda-acento">
                              {porQue}
                            </span>
                          ) : (
                            a.tagline && (
                              <span className="block truncate text-sm text-tienda-tenue">
                                {a.tagline}
                              </span>
                            )
                          );
                        })()}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-tienda-tenue">
                        {formatCurrency(a.precio)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {buscando && resultados.length > 0 && (
              <button
                type="button"
                onClick={irAlCatalogo}
                style={{ ["--retardo" as string]: `${resultados.length * 45}ms` }}
                className="resultado mt-5 block w-full py-2 text-center text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-200 ease-out hover:text-tienda-texto"
              >
                Ver todos los resultados
              </button>
            )}

            {!buscando && (
              <p className="text-center text-sm text-tienda-tenue">
                Escribe para buscar entre los jabones, cremas y packs.
              </p>
            )}
          </div>
        </div>
      </div>
    </CapaPantalla>
  );
}
