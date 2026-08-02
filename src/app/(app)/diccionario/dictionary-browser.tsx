"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronRight } from "lucide-react";
import {
  GLOSSARY_CATEGORIES,
  GLOSSARY_ORDER,
  glossaryCategoryMeta,
  type GlossaryCategoryKey,
} from "@/lib/diccionario";

export type TermCard = {
  id: string;
  slug: string;
  term: string;
  shortDef: string;
  category: string;
  aliases: string;
};

export function DictionaryBrowser({ terms }: { terms: TermCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<GlossaryCategoryKey | "todas">(
    "todas"
  );

  const present = useMemo(
    () => GLOSSARY_ORDER.filter((c) => terms.some((t) => t.category === c)),
    [terms]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      if (category !== "todas" && t.category !== category) return false;
      if (!q) return true;
      // También busca por los alias, para que «catiónica» encuentre
      // «Catiónico»
      return (
        t.term.toLowerCase().includes(q) ||
        t.shortDef.toLowerCase().includes(q) ||
        t.aliases.toLowerCase().includes(q)
      );
    });
  }, [terms, query, category]);

  const grouped = useMemo(() => {
    const map = new Map<string, TermCard[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return GLOSSARY_ORDER.filter((c) => map.has(c)).map((c) => ({
      key: c,
      terms: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar una palabra…"
          className="h-12 pl-9 pr-10 text-base"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 size-9 rounded-full hover:bg-accent flex items-center justify-center"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip
          active={category === "todas"}
          onClick={() => setCategory("todas")}
          label="Todas"
          count={terms.length}
        />
        {present.map((c) => (
          <Chip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={GLOSSARY_CATEGORIES[c].short}
            count={terms.filter((t) => t.category === c).length}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No encontré esa palabra.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Si es una palabra del recetario que no está aquí, avísale a Deiby
            para agregarla.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, terms: list }) => {
            const meta = glossaryCategoryMeta(key);
            const Icon = meta.icon;
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`size-4 shrink-0 ${meta.accent}`} />
                  <h2 className="text-sm font-semibold">{meta.label}</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {list.length}
                  </span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {list.map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/diccionario/${t.slug}`}
                        className="h-full flex items-start gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/40 transition-colors active:scale-[0.99]"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold leading-tight">
                            {t.term}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 leading-snug">
                            {t.shortDef}
                          </p>
                        </div>
                        <ChevronRight className="size-5 text-muted-foreground shrink-0 mt-0.5" />
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

function Chip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3.5 rounded-full text-sm font-medium border transition-colors active:scale-95 ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card hover:bg-accent"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "text-muted-foreground"}`}
      >
        {count}
      </span>
    </button>
  );
}
