import {
  Compass,
  Clapperboard,
  Camera,
  Scissors,
  ShieldAlert,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

/**
 * El catálogo de secciones vive aparte del lector de documentos porque el
 * lector usa `node:fs` y no se puede empaquetar para el navegador. El
 * buscador, que sí corre en el cliente, necesita los nombres y los colores
 * pero no los archivos.
 */

export type AvSeccionId =
  | "estrategia"
  | "guiones"
  | "produccion"
  | "plan"
  | "postproduccion"
  | "claims";

export type AvSeccion = {
  id: AvSeccionId;
  carpeta: string;
  label: string;
  descripcion: string;
  icon: LucideIcon;
  chip: string;
  acento: string;
};

/** El orden de esta lista es el orden en que aparecen en la página. */
export const AV_SECCIONES: AvSeccion[] = [
  {
    id: "plan",
    carpeta: "06-plan-de-rodaje",
    label: "Plan de rodaje",
    descripcion: "Los dos días, hora por hora y plano por plano",
    icon: CalendarDays,
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    acento: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "guiones",
    carpeta: "02-guiones",
    label: "Guiones",
    descripcion: "Los videos, con su mecánica y la guía de voz",
    icon: Clapperboard,
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300",
    acento: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "produccion",
    carpeta: "03-produccion",
    label: "Producción",
    descripcion: "Cámara, luz, sonido y la voz de tu mamá",
    icon: Camera,
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300",
    acento: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "estrategia",
    carpeta: "01-estrategia",
    label: "Estrategia",
    descripcion: "Qué grabar, por qué, y qué está funcionando",
    icon: Compass,
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    acento: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "postproduccion",
    carpeta: "04-postproduccion",
    label: "Postproducción",
    descripcion: "El montaje en Resolve",
    icon: Scissors,
    chip: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300",
    acento: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "claims",
    carpeta: "05-claims",
    label: "Lo que no se puede decir",
    descripcion: "Claims prohibidos en cosmética, y con qué reemplazarlos",
    icon: ShieldAlert,
    chip: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
    acento: "text-red-600 dark:text-red-400",
  },
];

export function seccionMeta(id: string): AvSeccion {
  return AV_SECCIONES.find((s) => s.id === id) ?? AV_SECCIONES[0];
}
