import {
  FlaskConical,
  Bubbles,
  Droplets,
  SprayCan,
  Sparkles,
  Wind,
  Scissors,
} from "lucide-react";

/**
 * Metadatos de las categorías del recetario: nombre visible, icono y color.
 * Viven aquí para que el listado y el detalle no se desincronicen.
 */
export const RECIPE_CATEGORIES = {
  base: {
    label: "Preparaciones base",
    short: "Base",
    description: "Insumos que se preparan aparte y entran en otras recetas",
    icon: FlaskConical,
    // Clases completas, no interpoladas: Tailwind necesita verlas literales
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "bg-amber-500",
  },
  jabon: {
    label: "Jabones",
    short: "Jabones",
    description: "Jabones de glicerina",
    icon: Bubbles,
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-400",
    ring: "bg-emerald-500",
  },
  crema: {
    label: "Cremas",
    short: "Cremas",
    description: "Cremas faciales y corporales",
    icon: Droplets,
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
    ring: "bg-sky-500",
  },
  cabello: {
    label: "Cabello",
    short: "Cabello",
    description: "Champús, acondicionadores y tratamientos",
    icon: Scissors,
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300",
    accent: "text-cyan-600 dark:text-cyan-400",
    ring: "bg-cyan-500",
  },
  corporal: {
    label: "Cuidado corporal",
    short: "Corporal",
    description: "Desodorante, talco y body splash",
    icon: Wind,
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
    accent: "text-teal-600 dark:text-teal-400",
    ring: "bg-teal-500",
  },
  perfume: {
    label: "Perfumes",
    short: "Perfumes",
    description: "En alcohol, vaselinados y oleosos",
    icon: SprayCan,
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    accent: "text-violet-600 dark:text-violet-400",
    ring: "bg-violet-500",
  },
  otro: {
    label: "Otros",
    short: "Otros",
    description: "Resto de productos",
    icon: Sparkles,
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300",
    accent: "text-rose-600 dark:text-rose-400",
    ring: "bg-rose-500",
  },
} as const;

export type RecipeCategoryKey = keyof typeof RECIPE_CATEGORIES;

export const CATEGORY_ORDER: RecipeCategoryKey[] = [
  "base",
  "jabon",
  "crema",
  "cabello",
  "corporal",
  "perfume",
  "otro",
];

export function categoryMeta(key: string) {
  return (
    RECIPE_CATEGORIES[key as RecipeCategoryKey] ?? RECIPE_CATEGORIES.otro
  );
}
