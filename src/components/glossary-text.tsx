"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { BookOpen, X, ArrowRight } from "lucide-react";

export type GlossaryEntry = {
  slug: string;
  term: string;
  aliases: string[];
  shortDef: string;
};

type Ctx = {
  terms: GlossaryEntry[];
  open: (slug: string) => void;
};

const GlossaryContext = createContext<Ctx | null>(null);

/**
 * Detecta las palabras del diccionario dentro de los textos de una receta
 * y las vuelve tocables.
 *
 * Al tocarlas NO se navega: se abre una tarjeta desde abajo con la
 * explicación. Salir de una receta que estás siguiendo con las manos
 * ocupadas sería lo peor que podría hacer esta función.
 */
export function GlossaryProvider({
  terms,
  children,
}: {
  terms: GlossaryEntry[];
  children: React.ReactNode;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = useCallback((slug: string) => setOpenSlug(slug), []);
  const entry = terms.find((t) => t.slug === openSlug) ?? null;

  return (
    <GlossaryContext.Provider value={{ terms, open }}>
      {children}

      {entry && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpenSlug(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl sm:mb-8 border shadow-lg p-5 pb-7 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <h2 className="text-lg font-bold leading-tight">{entry.term}</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenSlug(null)}
                aria-label="Cerrar"
                className="size-9 rounded-full hover:bg-accent flex items-center justify-center shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed">{entry.shortDef}</p>

            <Link
              href={`/sistema/diccionario/${entry.slug}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3"
            >
              Ver explicación completa
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      )}
    </GlossaryContext.Provider>
  );
}

/** Quita acentos para poder comparar sin importar cómo se escribió. */
function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Texto con las palabras del diccionario resaltadas y tocables.
 *
 * Solo se enlaza la PRIMERA aparición de cada término dentro del mismo
 * bloque: si se enlazaran todas, un paso con tres «conservante» quedaría
 * ilegible.
 */
export function GlossaryText({ children }: { children: string }) {
  const ctx = useContext(GlossaryContext);

  // Términos ordenados de más largo a más corto, para que "fase grasa"
  // gane sobre "fase" cuando ambos existan.
  const patterns = useMemo(() => {
    if (!ctx) return [];
    const out: { slug: string; needle: string }[] = [];
    for (const t of ctx.terms) {
      for (const form of [t.term, ...t.aliases]) {
        const n = fold(form).trim();
        if (n.length >= 3) out.push({ slug: t.slug, needle: n });
      }
    }
    return out.sort((a, b) => b.needle.length - a.needle.length);
  }, [ctx]);

  if (!ctx || patterns.length === 0) return <>{children}</>;

  const text = children;
  const folded = fold(text);
  const used = new Set<string>();

  // Marcamos los rangos que corresponden a un término, cuidando de no
  // solapar dos coincidencias.
  const taken: boolean[] = new Array(text.length).fill(false);
  const hits: { start: number; end: number; slug: string }[] = [];

  for (const { slug, needle } of patterns) {
    if (used.has(slug)) continue;
    let from = 0;
    while (from < folded.length) {
      const i = folded.indexOf(needle, from);
      if (i === -1) break;

      const before = i === 0 ? " " : folded[i - 1];
      const after =
        i + needle.length >= folded.length ? " " : folded[i + needle.length];
      const isWord = /[a-z0-9]/.test(before) || /[a-z0-9]/.test(after);
      const overlaps = taken
        .slice(i, i + needle.length)
        .some((t) => t);

      if (!isWord && !overlaps) {
        for (let k = i; k < i + needle.length; k++) taken[k] = true;
        hits.push({ start: i, end: i + needle.length, slug });
        used.add(slug);
        break;
      }
      from = i + 1;
    }
  }

  if (hits.length === 0) return <>{text}</>;

  hits.sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const [i, h] of hits.entries()) {
    if (h.start > cursor) parts.push(text.slice(cursor, h.start));
    parts.push(
      <button
        key={`${h.slug}-${i}`}
        type="button"
        onClick={() => ctx.open(h.slug)}
        className="underline decoration-dotted decoration-primary/60 underline-offset-2 hover:decoration-solid hover:text-primary transition-colors"
      >
        {text.slice(h.start, h.end)}
      </button>
    );
    cursor = h.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
