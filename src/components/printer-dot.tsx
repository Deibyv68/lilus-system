"use client";

import { useEffect, useState } from "react";

type PrinterStatus =
  | "ok"
  | "printing"
  | "offline"
  | "stopped"
  | "not_installed"
  | "error"
  | "unknown";

type State = "loading" | "ok" | "warning" | "down" | "off";

/**
 * Punto pequeño y discreto que muestra el estado de la impresora en tiempo
 * real. Pensado para esquinas de previews y otras zonas donde queremos
 * indicación visual sin ocupar espacio.
 *
 * - Verde + parpadeo suave: impresora conectada y lista
 * - Amarillo: impresora con problema (sin papel, etc.)
 * - Rojo: agente caído o impresora desconectada
 * - Gris: agente desactivado
 */
export function PrinterDot() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/agent/status");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          enabled: boolean;
          agentOnline: boolean;
          printerStatus: PrinterStatus;
        };
        if (cancelled) return;
        if (!data.enabled) setState("off");
        else if (!data.agentOnline) setState("down");
        else if (data.printerStatus === "ok" || data.printerStatus === "printing")
          setState("ok");
        else if (data.printerStatus === "offline") setState("down");
        else setState("warning");
      } catch {}
    }
    check();
    const t = setInterval(check, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const cfg = (() => {
    switch (state) {
      case "ok":
        return {
          color: "bg-green-500",
          ring: "bg-green-500/40",
          title: "Impresora conectada",
          pulse: true,
        };
      case "warning":
        return {
          color: "bg-amber-500",
          ring: "bg-amber-500/40",
          title: "Impresora con aviso",
          pulse: false,
        };
      case "down":
        return {
          color: "bg-red-500",
          ring: "bg-red-500/40",
          title: "Impresora desconectada",
          pulse: false,
        };
      case "off":
        return {
          color: "bg-zinc-400",
          ring: "bg-zinc-400/40",
          title: "Impresora desactivada",
          pulse: false,
        };
      default:
        return {
          color: "bg-zinc-300",
          ring: "bg-zinc-300/40",
          title: "Verificando…",
          pulse: false,
        };
    }
  })();

  return (
    <span
      title={cfg.title}
      aria-label={cfg.title}
      className="relative inline-flex items-center justify-center size-3 shrink-0"
    >
      {cfg.pulse && (
        <span
          className={`absolute inset-0 rounded-full ${cfg.ring} animate-ping`}
        />
      )}
      <span className={`relative size-2.5 rounded-full ${cfg.color}`} />
    </span>
  );
}
