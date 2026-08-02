import { FlaskConical, Package, Cog, Ruler, ShieldAlert } from "lucide-react";

/**
 * Categorías del diccionario. Los nombres visibles evitan
 * deliberadamente el vocabulario técnico: sería contradictorio que la
 * sección que explica las palabras difíciles use palabras difíciles para
 * organizarse.
 */
export const GLOSSARY_CATEGORIES = {
  quimica: {
    label: "Cómo funcionan las cosas",
    short: "Cómo funciona",
    icon: FlaskConical,
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    accent: "text-violet-600 dark:text-violet-400",
  },
  ingrediente: {
    label: "Tipos de ingrediente",
    short: "Ingredientes",
    icon: Package,
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  proceso: {
    label: "Formas de trabajar",
    short: "Procesos",
    icon: Cog,
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
  },
  medida: {
    label: "Medidas y datos",
    short: "Medidas",
    icon: Ruler,
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
  },
  seguridad: {
    label: "Cuidados y seguridad",
    short: "Seguridad",
    icon: ShieldAlert,
    chip: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
    accent: "text-red-600 dark:text-red-400",
  },
} as const;

export type GlossaryCategoryKey = keyof typeof GLOSSARY_CATEGORIES;

export const GLOSSARY_ORDER: GlossaryCategoryKey[] = [
  "quimica",
  "ingrediente",
  "proceso",
  "medida",
  "seguridad",
];

export function glossaryCategoryMeta(key: string) {
  return (
    GLOSSARY_CATEGORIES[key as GlossaryCategoryKey] ??
    GLOSSARY_CATEGORIES.ingrediente
  );
}
