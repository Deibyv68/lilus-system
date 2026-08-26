"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Search,
  X,
  ChevronRight,
  AlertTriangle,
  Snowflake,
  ShoppingCart,
  CircleDashed,
} from "lucide-react";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_ORDER,
  materialCategoryMeta,
  type MaterialCategoryKey,
} from "@/lib/inventario";

export type MaterialCard = {
  id: string;
  slug: string;
  name: string;
  category: string;
  inciName: string | null;
  purpose: string | null;
  storage: string | null;
  hasTechData: boolean;
  pendingPurchase: boolean;
  openLots: number;
  expiringSoon: boolean;
};

type Filter = MaterialCategoryKey | "todas" | "sin-ficha" | "por-comprar";

export function MaterialBrowser({ materials }: { materials: MaterialCard[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todas");

  const presentCategories = useMemo(
    () =>
      MATERIAL_CATEGORY_ORDER.filter((c) =>
        materials.some((m) => m.category === c)
      ),
    [materials]
  );

  const sinFicha = materials.filter((m) => !m.hasTechData).length;
  const porComprar = materials.filter((m) => m.pendingPurchase).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials.filter((m) => {
      if (filter === "sin-ficha" && m.hasTechData) return false;
      if (filter === "por-comprar" && !m.pendingPurchase) return false;
      if (
        filter !== "todas" &&
        filter !== "sin-ficha" &&
        filter !== "por-comprar" &&
        m.category !== filter
      )
        return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.inciName ?? "").toLowerCase().includes(q) ||
        (m.purpose ?? "").toLowerCase().includes(q)
      );
    });
  }, [materials, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, MaterialCard[]>();
    for (const m of filtered) {
      const arr = map.get(m.category) ?? [];
      arr.push(m);
      map.set(m.category, arr);
    }
    return MATERIAL_CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      key: c,
      materials: map.get(c)!,
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
          placeholder="Buscar por nombre o INCI…"
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

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Chip
          active={filter === "todas"}
          onClick={() => setFilter("todas")}
          label="Todas"
          count={materials.length}
        />
        {sinFicha > 0 && (
          <Chip
            active={filter === "sin-ficha"}
            onClick={() => setFilter("sin-ficha")}
            label="Sin ficha técnica"
            count={sinFicha}
            tone="warning"
          />
        )}
        {porComprar > 0 && (
          <Chip
            active={filter === "por-comprar"}
            onClick={() => setFilter("por-comprar")}
            label="Por comprar"
            count={porComprar}
            tone="info"
          />
        )}
        {presentCategories.map((c) => (
          <Chip
            key={c}
            active={filter === c}
            onClick={() => setFilter(c)}
            label={MATERIAL_CATEGORIES[c].label}
            count={materials.filter((m) => m.category === c).length}
          />
        ))}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <Search className="size-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Ninguna materia prima coincide.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ key, materials: list }) => {
            const meta = materialCategoryMeta(key);
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
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {list.map((m) => (
                    <li key={m.id}>
                      <MaterialRow material={m} />
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
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: "warning" | "info";
}) {
  const inactive =
    tone === "warning"
      ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900"
      : tone === "info"
        ? "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-900"
        : "bg-card hover:bg-accent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 px-3.5 rounded-full text-sm font-medium border transition-colors active:scale-95 ${
        active ? "bg-primary text-primary-foreground border-primary" : inactive
      }`}
    >
      {label}
      <span
        className={`ml-1.5 tabular-nums ${active ? "opacity-70" : "opacity-60"}`}
      >
        {count}
      </span>
    </button>
  );
}

function MaterialRow({ material: m }: { material: MaterialCard }) {
  const meta = materialCategoryMeta(m.category);
  const Icon = meta.icon;

  return (
    <Link
      href={`/sistema/inventario/${m.slug}`}
      className="h-full flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-primary/40 transition-colors active:scale-[0.99]"
    >
      <div
        className={`size-11 rounded-lg flex items-center justify-center shrink-0 ${meta.chip}`}
      >
        <Icon className="size-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold leading-tight truncate">{m.name}</p>
          {m.storage === "refrigerado" && (
            <Snowflake
              className="size-3.5 text-sky-500 shrink-0"
              aria-label="Refrigerado"
            />
          )}
        </div>
        {m.inciName && (
          <p className="text-2xs text-muted-foreground font-mono truncate">
            {m.inciName}
          </p>
        )}
        {m.purpose && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {m.purpose}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-2xs">
          {m.pendingPurchase && (
            <span className="inline-flex items-center gap-0.5 text-sky-600 dark:text-sky-400">
              <ShoppingCart className="size-3" /> por comprar
            </span>
          )}
          {!m.hasTechData && !m.pendingPurchase && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="size-3" /> sin ficha
            </span>
          )}
          {m.openLots > 0 && (
            <span className="text-muted-foreground tabular-nums">
              {m.openLots} {m.openLots === 1 ? "lote abierto" : "lotes abiertos"}
            </span>
          )}
          {m.openLots === 0 && !m.pendingPurchase && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              <CircleDashed className="size-3" /> sin lotes
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="size-5 text-muted-foreground shrink-0" />
    </Link>
  );
}
