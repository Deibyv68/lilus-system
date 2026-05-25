"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, AlertTriangle, PowerOff, Loader2 } from "lucide-react";

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
 * Chip pequeño con icono de señal + texto que indica si la impresora está
 * conectada o no. Pensado para esquinas de previews — más visible que un
 * puntito de color pero igual de discreto, con label que se entiende a
 * primera vista.
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
          Icon: Wifi,
          label: "Lista",
          bg: "bg-green-100 dark:bg-green-950/40",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-300 dark:border-green-900",
        };
      case "warning":
        return {
          Icon: AlertTriangle,
          label: "Aviso",
          bg: "bg-amber-100 dark:bg-amber-950/40",
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-300 dark:border-amber-900",
        };
      case "down":
        return {
          Icon: WifiOff,
          label: "Sin conexión",
          bg: "bg-red-100 dark:bg-red-950/40",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-300 dark:border-red-900",
        };
      case "off":
        return {
          Icon: PowerOff,
          label: "Off",
          bg: "bg-zinc-100 dark:bg-zinc-900",
          text: "text-zinc-600 dark:text-zinc-400",
          border: "border-zinc-300 dark:border-zinc-800",
        };
      default:
        return {
          Icon: Loader2,
          label: "…",
          bg: "bg-muted",
          text: "text-muted-foreground",
          border: "border-muted",
        };
    }
  })();

  const { Icon } = cfg;
  const animate = state === "loading";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold leading-none ${cfg.bg} ${cfg.text} ${cfg.border}`}
      aria-label={`Impresora: ${cfg.label}`}
    >
      <Icon className={`size-3 shrink-0 ${animate ? "animate-spin" : ""}`} />
      <span>{cfg.label}</span>
    </span>
  );
}
