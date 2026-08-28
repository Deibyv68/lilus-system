"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { esperaDePago, haceCuanto } from "@/lib/espera-de-pago";

/**
 * El reloj de la lista de pedidos.
 *
 * ── Por qué se recalcula en el cliente ──
 *
 * El panel se queda abierto. Tu mamá lo deja en el celular mientras hace
 * otra cosa y vuelve al rato: si el texto se calculara solo en el
 * servidor, «hace 5 min» seguiría diciendo cinco minutos una hora
 * después. Se recalcula cada minuto.
 *
 * `suppressHydrationWarning` es a propósito: entre que el servidor pinta
 * el HTML y el navegador lo hidrata pueden pasar unos segundos, y si
 * justo en ese momento se cruza un minuto los dos textos no coinciden. Es
 * la diferencia esperada de cualquier reloj, no un error que tapar.
 */

/** Un minuto: por debajo de eso nadie mira si el texto cambió. */
const CADA = 60_000;

function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), CADA);
    return () => clearInterval(id);
  }, []);
  return ahora;
}

export function HaceCuanto({ fecha }: { fecha: string | Date }) {
  const ahora = useAhora();
  return <span suppressHydrationWarning>{haceCuanto(fecha, ahora)}</span>;
}

/**
 * La banda que avisa que hay un pago sin confirmar.
 *
 * Ocupa una línea entera, así que solo va donde hay UN pedido delante: en
 * su ficha. En la lista se usa `ChipDeEspera`, que dice lo mismo en tres
 * palabras — ver ahí el porqué.
 */
export function AvisoDePago({
  estado,
  creadoEn,
}: {
  estado: string;
  creadoEn: string | Date;
}) {
  const ahora = useAhora();
  const espera = esperaDePago(estado, creadoEn, ahora);
  if (!espera) return null;

  const estilo = {
    tranquilo:
      "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
    atencion:
      "border-orange-400/70 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950/50 dark:text-orange-200",
    vencido:
      "border-red-400/70 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
  }[espera.nivel];

  const Icono = espera.nivel === "tranquilo" ? Clock : AlertTriangle;

  return (
    <div
      className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 ${estilo}`}
      suppressHydrationWarning
    >
      <Icono className="mt-0.5 size-3.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight">{espera.aviso}</p>
        <p className="mt-0.5 text-2xs leading-snug opacity-80">
          {espera.detalle}
        </p>
      </div>
    </div>
  );
}

/**
 * El mismo reloj, del tamaño de una etiqueta, para las listas.
 *
 * ── Por qué no la banda ──
 *
 * La banda se escribió para que no se leyera como una etiqueta más entre
 * «Web» y «Servientrega». El razonamiento era bueno y el resultado no:
 * casi todos los pedidos de una lista están pendientes, así que la banda
 * salía en casi todas las tarjetas, repitiendo la misma frase. Catorce
 * avisos idénticos no son catorce avisos, son un fondo de pantalla.
 *
 * ── Lo que se conserva de la idea ──
 *
 * Que lo urgente no se confunda con lo demás. Pero eso ahora lo hace el
 * color y no el tamaño: mientras sobra tiempo el chip va gris, callado
 * entre los otros, porque no hay nada que hacer todavía. Cuando quedan
 * doce horas se pone ámbar, y cuando se pasa de las 48 se pone rojo con
 * el icono de alerta.
 *
 * Así la lista está tranquila cuando no pasa nada y grita solo en el
 * pedido que de verdad lo necesita — que es lo que la banda quería
 * conseguir y no conseguía gritando en todos a la vez.
 */
export function ChipDeEspera({
  estado,
  creadoEn,
}: {
  estado: string;
  creadoEn: string | Date;
}) {
  const ahora = useAhora();
  const espera = esperaDePago(estado, creadoEn, ahora);
  if (!espera) return null;

  const estilo = {
    tranquilo:
      "border-border text-muted-foreground",
    atencion:
      "border-amber-400/70 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
    vencido:
      "border-red-400/70 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200",
  }[espera.nivel];

  const Icono = espera.nivel === "vencido" ? AlertTriangle : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-3xs font-medium ${estilo}`}
      suppressHydrationWarning
      title={espera.detalle}
    >
      <Icono className="size-2.5" />
      {espera.breve}
    </span>
  );
}
