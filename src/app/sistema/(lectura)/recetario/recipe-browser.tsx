"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Search, X, ChevronRight, Link2 } from "lucide-react";
import {
  CATEGORY_ORDER,
  RECIPE_CATEGORIES,
  categoryMeta,
  type RecipeCategoryKey,
} from "@/lib/recetario";

export type RecipeCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string | null;
  imageUrl: string | null;
  ingredientCount: number;
  stepCount: number;
  usedInCount: number;
  productName: string | null;
};

export function RecipeBrowser({ recipes }: { recipes: RecipeCard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RecipeCategoryKey | "todas">("todas");

  // Solo mostramos categorías que tienen recetas
  const presentCategories = useMemo(
    () => CATEGORY_ORDER.filter((c) => recipes.some((r) => r.category === c)),
    [recipes]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      if (category !== "todas" && r.category !== category) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.summary ?? "").toLowerCase().includes(q) ||
        (r.productName ?? "").toLowerCase().includes(q)
      );
    });
  }, [recipes, query, category]);

  // Agrupadas por categoría para que no sea una lista plana de 23
  const grouped = useMemo(() => {
    const map = new Map<string, RecipeCard[]>();
    for (const r of filtered) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      key: c,
      recipes: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar receta…"
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

      {/* Categorías: se acomodan en varias líneas, sin scroll horizontal */}
      <div className="flex flex-wrap gap-2">
        <CategoryChip
          active={category === "todas"}
          onClick={() => setCategory("todas")}
          label="Todas"
          count={recipes.length}
        />
        {presentCategories.map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={RECIPE_CATEGORIES[c].short}
            count={recipes.filter((r) => r.category === c).length}
          />
        ))}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Ninguna receta coincide con la búsqueda.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, recipes: list }) => {
            const meta = categoryMeta(key);
            const Icon = meta.icon;
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`size-4 shrink-0 ${meta.accent}`} />
                  <h2 className="text-sm tablet:text-lg font-semibold">{meta.label}</h2>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {list.length}
                  </span>
                </div>

                {/* Una columna en móvil, dos desde tablet */}
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {list.map((r) => (
                    <li key={r.id}>
                      <RecipeRow recipe={r} />
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

function CategoryChip({
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
        className={`ml-1.5 tabular-nums ${
          active ? "opacity-70" : "text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function RecipeRow({ recipe: r }: { recipe: RecipeCard }) {
  const meta = categoryMeta(r.category);
  const Icon = meta.icon;

  return (
    <Link
      href={`/sistema/recetario/${r.slug}`}
      className="h-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/40 transition-colors active:scale-[0.99]"
    >
      {r.imageUrl ? (
        <div className="relative size-14 rounded-lg overflow-hidden bg-muted shrink-0">
          <Image src={r.imageUrl} alt="" fill sizes="56px" className="object-cover" />
        </div>
      ) : (
        <div
          className={`size-14 rounded-lg flex items-center justify-center shrink-0 ${meta.chip}`}
        >
          <Icon className="size-6" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-tight">{r.name}</p>
        {r.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {r.summary}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-2xs text-muted-foreground">
          <span className="tabular-nums">{r.ingredientCount} ingredientes</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{r.stepCount} pasos</span>
          {r.usedInCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-0.5 tabular-nums">
                <Link2 className="size-3 shrink-0" />
                {r.usedInCount}
              </span>
            </>
          )}
        </div>
      </div>

      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
