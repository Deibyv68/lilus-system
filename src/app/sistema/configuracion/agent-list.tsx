"use client";

import { useEffect, useState } from "react";
import { Monitor, Printer, PrinterX, Loader2 } from "lucide-react";

type Agent = {
  name: string;
  online: boolean;
  printerStatus: string;
  hasPrinter: boolean;
  lastSeenAgo: number;
};

/**
 * Las PCs que tienen el agente instalado, y cuál de ellas tiene la
 * impresora ahora.
 *
 * Existe porque la impresora es una sola y se muda de computadora: al
 * pasar el cable conviene poder confirmar de un vistazo que el sistema
 * ya se dio cuenta, en vez de mandar una etiqueta a ciegas.
 */
export function AgentList() {
  const [agents, setAgents] = useState<Agent[] | null>(null);

  useEffect(() => {
    let cancelado = false;
    async function check() {
      try {
        const res = await fetch("/api/agent/status");
        if (!res.ok || cancelado) return;
        const data = await res.json();
        if (!cancelado) setAgents(data.agents ?? []);
      } catch {}
    }
    check();
    const t = setInterval(check, 4000);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
  }, []);

  if (agents === null) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Buscando computadoras…
      </p>
    );
  }

  if (agents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Todavía no se conectó ninguna computadora. Aparecen solas apenas
        arranca el agente en cada una.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {agents.map((a) => (
        <li
          key={a.name}
          className={`flex items-center gap-3 p-3 rounded-lg border ${
            a.hasPrinter
              ? "border-green-400 bg-green-50 dark:bg-green-950/25 dark:border-green-900"
              : "bg-card"
          }`}
        >
          <div
            className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
              a.hasPrinter
                ? "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {a.hasPrinter ? (
              <Printer className="size-4" />
            ) : a.online ? (
              <PrinterX className="size-4" />
            ) : (
              <Monitor className="size-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.name}</p>
            <p className="text-2xs text-muted-foreground">
              {a.hasPrinter
                ? "Tiene la impresora — acá sale la etiqueta"
                : a.online
                  ? "Encendida, sin la impresora conectada"
                  : `Apagada o sin conexión · ${describirTiempo(a.lastSeenAgo)}`}
            </p>
          </div>

          <span
            className={`size-2 rounded-full shrink-0 ${
              a.hasPrinter
                ? "bg-green-500"
                : a.online
                  ? "bg-amber-500"
                  : "bg-muted-foreground/40"
            }`}
            aria-hidden
          />
        </li>
      ))}
    </ul>
  );
}

function describirTiempo(ms: number) {
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "hace segundos";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d > 1 ? "s" : ""}`;
}
