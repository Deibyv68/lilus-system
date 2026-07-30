import {
  Package,
  Droplet,
  Blend,
  ShieldCheck,
  Sparkles,
  FlaskConical,
  Droplets,
  Leaf,
  Mountain,
  Sprout,
  Palette,
  Wind,
  Wrench,
} from "lucide-react";

/**
 * Categorías de materia prima: nombre visible, icono y color.
 * El orden define cómo se agrupan en el listado.
 */
export const MATERIAL_CATEGORIES = {
  base: {
    label: "Bases",
    icon: Package,
    chip: "bg-stone-100 text-stone-800 dark:bg-stone-900/60 dark:text-stone-300",
    accent: "text-stone-600 dark:text-stone-400",
  },
  tensioactivo: {
    label: "Tensioactivos",
    icon: Droplet,
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
    accent: "text-cyan-600 dark:text-cyan-400",
  },
  emulsionante: {
    label: "Emulsionantes y espesantes",
    icon: Blend,
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
    accent: "text-teal-600 dark:text-teal-400",
  },
  conservante: {
    label: "Conservantes",
    icon: ShieldCheck,
    chip: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
    accent: "text-red-600 dark:text-red-400",
  },
  activo: {
    label: "Activos",
    icon: Sparkles,
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    accent: "text-violet-600 dark:text-violet-400",
  },
  acido: {
    label: "Ácidos",
    icon: FlaskConical,
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300",
    accent: "text-orange-600 dark:text-orange-400",
  },
  aceite: {
    label: "Aceites y mantecas",
    icon: Droplets,
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
  },
  esencial: {
    label: "Aceites esenciales",
    icon: Leaf,
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  arcilla: {
    label: "Arcillas y minerales",
    icon: Mountain,
    chip: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-300",
    accent: "text-yellow-700 dark:text-yellow-400",
  },
  vegetal: {
    label: "Vegetales y polvos",
    icon: Sprout,
    chip: "bg-lime-100 text-lime-800 dark:bg-lime-950/50 dark:text-lime-300",
    accent: "text-lime-700 dark:text-lime-400",
  },
  colorante: {
    label: "Colorantes",
    icon: Palette,
    chip: "bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300",
    accent: "text-pink-600 dark:text-pink-400",
  },
  aroma: {
    label: "Aromas y perfumería",
    icon: Wind,
    chip: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  auxiliar: {
    label: "Auxiliares",
    icon: Wrench,
    chip: "bg-slate-100 text-slate-800 dark:bg-slate-900/60 dark:text-slate-300",
    accent: "text-slate-600 dark:text-slate-400",
  },
} as const;

export type MaterialCategoryKey = keyof typeof MATERIAL_CATEGORIES;

export const MATERIAL_CATEGORY_ORDER: MaterialCategoryKey[] = [
  "base",
  "tensioactivo",
  "emulsionante",
  "conservante",
  "activo",
  "acido",
  "aceite",
  "esencial",
  "arcilla",
  "vegetal",
  "colorante",
  "aroma",
  "auxiliar",
];

export function materialCategoryMeta(key: string) {
  return (
    MATERIAL_CATEGORIES[key as MaterialCategoryKey] ??
    MATERIAL_CATEGORIES.auxiliar
  );
}

/** Estados de un lote, con su color. */
export const LOT_STATUS = {
  "sin-abrir": {
    label: "Sin abrir",
    chip: "bg-muted text-muted-foreground",
  },
  abierto: {
    label: "Abierto",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  agotado: {
    label: "Agotado",
    chip: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  },
  descartado: {
    label: "Descartado",
    chip: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  },
} as const;

export function lotStatusMeta(key: string) {
  return LOT_STATUS[key as keyof typeof LOT_STATUS] ?? LOT_STATUS["sin-abrir"];
}
