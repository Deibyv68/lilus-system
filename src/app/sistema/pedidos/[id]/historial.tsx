"use client";

import { useState } from "react";
import {
  PackagePlus,
  CircleDot,
  MessageCircle,
  Mail,
  Truck,
  Receipt,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from "lucide-react";
import type {
  EntradaDelHistorial,
  IconoDelHistorial,
  TonoDelHistorial,
} from "@/lib/eventos-pedido";

/**
 * El historial del pedido: qué le pasó y cuándo.
 *
 * ── Por qué la hora va suelta y la fecha va arriba ──
 *
 * Poner la fecha completa en cada línea llena la tarjeta de «28 ago
 * 2026» repetido ocho veces, y en un teléfono eso es media pantalla
 * gastada en decir lo mismo. Agrupando por día, la fecha se escribe una
 * vez y cada línea solo lleva su hora.
 *
 * ── Por qué no dice «hace 3 días» ──
 *
 * Sería más agradable de leer, pero «hace» se calcula contra el reloj de
 * quien mira, y esta tarjeta se pinta primero en el servidor. Los dos
 * relojes no marcan lo mismo al milisegundo, así que React encontraría
 * un texto en el HTML y otro al hidratar, y avisaría del desajuste. Una
 * fecha escrita entera es igual de cierta a cualquier hora.
 */

const ICONOS: Record<IconoDelHistorial, typeof CircleDot> = {
  creado: PackagePlus,
  estado: CircleDot,
  mensaje: MessageCircle,
  correo: Mail,
  guia: Truck,
  comprobante: Receipt,
  revisado: CheckCircle2,
  descartado: XCircle,
};

/*
  El color va en el punto, no en el texto.

  Es la misma regla que en las etiquetas de estado: el color se lee antes
  que la palabra. Verde es «salió bien», ámbar es «esto espera algo»,
  rojo es «se cayó». Lo que no es ninguna de las tres se queda gris, que
  es la mayoría — y por eso las tres que sí tienen color se ven.
*/
const COLORES: Record<TonoDelHistorial, string> = {
  normal: "bg-muted text-muted-foreground",
  bueno: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  aviso: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  malo: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

/** Cuántas líneas se ven sin desplegar. */
const A_LA_VISTA = 5;

function dia(iso: string): string {
  return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat("es-EC", { timeStyle: "short" }).format(
    new Date(iso)
  );
}

export function Historial({ entradas }: { entradas: EntradaDelHistorial[] }) {
  const [todo, setTodo] = useState(false);

  if (entradas.length === 0) return null;

  const ocultas = todo ? 0 : Math.max(0, entradas.length - A_LA_VISTA);
  const visibles = ocultas > 0 ? entradas.slice(ocultas) : entradas;

  /*
    Qué líneas estrenan día, calculado de una vez y sin ir guardando la
    anterior sobre la marcha: comparar contra el elemento de al lado es
    lo mismo y no obliga a modificar nada mientras se pinta.

    Se mide sobre lo VISIBLE y no sobre la lista entera, porque si no,
    al desplegar, la primera línea podría quedarse sin su fecha.
  */
  const conDia = visibles.map((e, i) => ({
    e,
    nuevoDia: i === 0 || dia(e.cuando) !== dia(visibles[i - 1].cuando),
  }));

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        Historial
      </p>

      {ocultas > 0 && (
        <button
          type="button"
          onClick={() => setTodo(true)}
          className="flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown className="size-3" />
          Ver {ocultas} {ocultas === 1 ? "anterior" : "anteriores"}
        </button>
      )}

      <ol className="space-y-0">
        {conDia.map(({ e, nuevoDia }, i) => {
          const Icono = ICONOS[e.icono] ?? CircleDot;
          const ultima = i === conDia.length - 1;

          return (
            <li key={e.id}>
              {nuevoDia && (
                <p className="pb-1 pl-8 pt-2 text-2xs text-muted-foreground first:pt-0">
                  {dia(e.cuando)}
                </p>
              )}

              <div className="relative flex gap-2.5 pb-2.5">
                {/*
                  La línea que une los puntos se dibuja desde cada uno
                  hacia abajo, y la última no la dibuja. Así no queda un
                  rabo colgando por debajo del último evento.
                */}
                {!ultima && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[11px] top-6 h-full w-px bg-border"
                  />
                )}

                <span
                  className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${
                    COLORES[e.tono ?? "normal"]
                  }`}
                >
                  <Icono className="size-3.5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium leading-5">{e.titulo}</p>
                    <span className="shrink-0 font-mono text-2xs tabular-nums text-muted-foreground">
                      {hora(e.cuando)}
                    </span>
                  </div>
                  {e.detalle && (
                    <p className="break-words text-2xs text-muted-foreground">
                      {e.detalle}
                    </p>
                  )}
                  {e.porQuien && (
                    <p className="text-2xs text-muted-foreground">
                      {e.porQuien}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/*
        La advertencia va una vez al pie y no en cada línea.

        Repetir «no sabemos si se envió» ocho veces convierte el aviso en
        ruido y deja de leerse. Dicho una vez, debajo, se entiende para
        toda la lista.
      */}
      <p className="pt-1 text-2xs leading-relaxed text-muted-foreground">
        «Preparado» quiere decir que se abrió WhatsApp con el mensaje
        escrito. Si de verdad se envió, eso solo lo sabe el chat.
      </p>
    </div>
  );
}
