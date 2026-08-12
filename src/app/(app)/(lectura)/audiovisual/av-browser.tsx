"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Clock, Star, X } from "lucide-react";
import { AV_SECCIONES } from "@/lib/audiovisual-secciones";

export type AvCard = {
  slug: string;
  titulo: string;
  resumen: string;
  seccion: string;
  destacado: boolean;
  minutos: number;
};

/** Quita acentos para poder buscar sin importar cómo se escriba. */
function plano(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AvBrowser({
  docs,
  secciones,
}: {
  docs: AvCard[];
  secciones: { id: string; label: string; descripcion: string; cuenta: number }[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = plano(busqueda.trim());
    return docs.filter((d) => {
      if (filtro && d.seccion !== filtro) return false;
      if (!q) return true;
      return plano(`${d.titulo} ${d.resumen}`).includes(q);
    });
  }, [docs, busqueda, filtro]);

  // Agrupados por sección, respetando el orden del catálogo
  const grupos = useMemo(() => {
    return AV_SECCIONES.map((s) => ({
      meta: s,
      items: visibles.filter((d) => d.seccion === s.id),
    })).filter((g) => g.items.length > 0);
  }, [visibles]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en los documentos…"
          aria-label="Buscar"
          className="w-full h-11 pl-9 pr-9 rounded-xl border bg-card text-sm tablet:text-base outline-none focus:ring-2 focus:ring-ring"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            aria-label="Limpiar"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 rounded-full hover:bg-accent flex items-center justify-center"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filtros por sección */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltro(null)}
          className={`h-9 px-3.5 rounded-full text-xs tablet:text-sm font-medium border transition-colors ${
            filtro === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card hover:bg-accent"
          }`}
        >
          Todo{" "}
          <span className="tabular-nums opacity-70">{docs.length}</span>
        </button>
        {secciones.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFiltro(filtro === s.id ? null : s.id)}
            className={`h-9 px-3.5 rounded-full text-xs tablet:text-sm font-medium border transition-colors ${
              filtro === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-accent"
            }`}
          >
            {s.label}{" "}
            <span className="tabular-nums opacity-70">{s.cuenta}</span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nada coincide con «{busqueda}».
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(({ meta, items }) => {
            const Icon = meta.icon;
            return (
              <section key={meta.id}>
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${meta.chip}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm tablet:text-lg font-semibold leading-tight">
                      {meta.label}
                    </h2>
                    <p className="text-2xs tablet:text-xs text-muted-foreground leading-snug">
                      {meta.descripcion}
                    </p>
                  </div>
                </div>

                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {items.map((d) => (
                    <li key={d.slug}>
                      <Link
                        href={`/audiovisual/${d.slug}`}
                        className="flex items-start gap-3 p-3 rounded-xl border bg-card hover:bg-accent transition-colors h-full"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1.5">
                            {d.destacado && (
                              <Star
                                className={`size-3.5 shrink-0 mt-0.5 fill-current ${meta.acento}`}
                                aria-label="Recomendado"
                              />
                            )}
                            <p className="font-semibold leading-tight">
                              {d.titulo}
                            </p>
                          </div>
                          {d.resumen && (
                            <p className="text-xs tablet:text-sm text-muted-foreground mt-1 leading-snug">
                              {d.resumen}
                            </p>
                          )}
                          <p className="text-2xs text-muted-foreground mt-1.5 inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {d.minutos} min de lectura
                          </p>
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground shrink-0 self-center" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
