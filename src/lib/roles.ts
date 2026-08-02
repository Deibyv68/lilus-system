/**
 * Etiquetas visibles de la función que cumple cada ingrediente dentro de
 * una receta.
 *
 * Están escritas como verbos y no como sustantivos técnicos: en la ficha
 * se lee mejor «Une agua y aceite» que «Emulsionante», sobre todo para
 * alguien que está aprendiendo. La palabra técnica está en el
 * diccionario, que es donde corresponde.
 */
export const ROLE_LABELS: Record<string, string> = {
  base: "Base",
  tensioactivo: "Limpia",
  emulsionante: "Une agua y aceite",
  espesante: "Espesa",
  conservante: "Conserva",
  quelante: "Protege la fórmula",
  antioxidante: "Antioxidante",
  activo: "Activo",
  humectante: "Humecta",
  emoliente: "Suaviza",
  oclusivo: "Sella",
  exfoliante: "Exfolia",
  absorbente: "Absorbe",
  solubilizante: "Disuelve aceites",
  ph: "Ajusta el pH",
  colorante: "Color",
  aroma: "Aroma",
  fijador: "Fija el aroma",
  solvente: "Disuelve",
  acondicionador: "Acondiciona",
};

/** Color de cada etiqueta, agrupando por familia de función. */
export const ROLE_STYLES: Record<string, string> = {
  base: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  tensioactivo: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
  solubilizante: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300",
  emulsionante: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
  espesante: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
  acondicionador: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
  conservante: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  quelante: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  antioxidante: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300",
  activo: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
  humectante: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
  emoliente: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  oclusivo: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  exfoliante: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  absorbente: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/60 dark:text-yellow-300",
  ph: "bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300",
  colorante: "bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300",
  aroma: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  fijador: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  solvente: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function roleLabel(role: string | null | undefined) {
  if (!role) return null;
  return ROLE_LABELS[role] ?? null;
}

export function roleStyle(role: string | null | undefined) {
  if (!role) return "bg-muted text-muted-foreground";
  return ROLE_STYLES[role] ?? "bg-muted text-muted-foreground";
}
