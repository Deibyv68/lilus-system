"use client";

import { useEffect, useState } from "react";
import {
  Printer,
  Wifi,
  WifiOff,
  PowerOff,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// Estado fisico de la impresora reportado por el agente
type PrinterStatus =
  | "ok"
  | "printing"
  | "offline"
  | "stopped"
  | "not_installed"
  | "error"
  | "unknown";

type State =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "agent_offline"; lastSeenAgo: number | null }
  | { kind: "printer_problem"; printerStatus: PrinterStatus }
  | { kind: "ok" };

export function AgentStatusBadge({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/agent/status");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          enabled: boolean;
          agentOnline: boolean;
          lastSeenAgo: number | null;
          printerStatus: PrinterStatus;
        };
        if (cancelled) return;
        if (!data.enabled) {
          setState({ kind: "disabled" });
        } else if (!data.agentOnline) {
          setState({ kind: "agent_offline", lastSeenAgo: data.lastSeenAgo });
        } else if (
          data.printerStatus === "ok" ||
          data.printerStatus === "printing"
        ) {
          setState({ kind: "ok" });
        } else {
          setState({
            kind: "printer_problem",
            printerStatus: data.printerStatus,
          });
        }
      } catch {}
    }
    check();
    const t = setInterval(check, 4000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const styles = (() => {
    if (state.kind === "loading") {
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-muted",
        Icon: Loader2,
        iconAnimate: true,
        title: "Verificando impresora…",
        sub: null as string | null,
      };
    }
    if (state.kind === "disabled") {
      return {
        bg: "bg-zinc-100 dark:bg-zinc-900",
        text: "text-zinc-600 dark:text-zinc-400",
        border: "border-zinc-200 dark:border-zinc-800",
        Icon: PowerOff,
        iconAnimate: false,
        title: "Impresora desactivada",
        sub: "Actívala en Configuración → Agente de impresión",
      };
    }
    if (state.kind === "agent_offline") {
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        text: "text-red-800 dark:text-red-300",
        border: "border-red-200 dark:border-red-900",
        Icon: WifiOff,
        iconAnimate: false,
        title: "PC de impresión no responde",
        sub:
          state.lastSeenAgo !== null
            ? `Última vez activa hace ${formatAgo(state.lastSeenAgo)} · Verifica que la PC del 1er piso esté prendida`
            : "Verifica que la PC del 1er piso esté prendida",
      };
    }
    if (state.kind === "printer_problem") {
      const labels: Record<PrinterStatus, { title: string; sub: string }> = {
        offline: {
          title: "Impresora desconectada",
          sub: "La MUNBYN está apagada, sin cable USB o sin papel. Revísala físicamente.",
        },
        stopped: {
          title: "Impresora detenida",
          sub: "La cola de impresión está pausada. Verifica el estado en Windows.",
        },
        not_installed: {
          title: "Impresora no encontrada",
          sub: "Windows no reconoce la impresora configurada. Verifica el nombre en Configuración.",
        },
        error: {
          title: "Error revisando impresora",
          sub: "El agente no pudo consultar el estado. Puede que haya un error de permisos en Windows.",
        },
        unknown: {
          title: "Estado de impresora desconocido",
          sub: "Aún no hay información del agente. Espera unos segundos.",
        },
        ok: { title: "", sub: "" },
        printing: { title: "", sub: "" },
      };
      const l = labels[state.printerStatus];
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-800 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-900",
        Icon: AlertTriangle,
        iconAnimate: false,
        title: l.title,
        sub: l.sub,
      };
    }
    // ok
    return {
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-800 dark:text-green-300",
      border: "border-green-200 dark:border-green-900",
      Icon: Wifi,
      iconAnimate: false,
      title: "Impresora lista",
      sub: "Las etiquetas saldrán por la MUNBYN automáticamente",
    };
  })();

  const { Icon, iconAnimate } = styles;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${styles.bg} ${styles.text} ${styles.border}`}
      >
        <Icon className={`size-3 ${iconAnimate ? "animate-spin" : ""}`} />
        {styles.title}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${styles.bg} ${styles.text} ${styles.border}`}
    >
      <div className="size-9 rounded-full bg-white/40 dark:bg-black/20 flex items-center justify-center shrink-0">
        <Icon className={`size-4 ${iconAnimate ? "animate-spin" : ""}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{styles.title}</p>
        {styles.sub && (
          <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
            {styles.sub}
          </p>
        )}
      </div>
    </div>
  );
}

function formatAgo(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} seg`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`;
  return `${Math.round(ms / 3_600_000)} h`;
}
