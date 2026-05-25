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
        dot: "bg-zinc-400",
        Icon: Loader2,
        iconAnimate: true,
        title: "Verificando impresora…",
        sub: null as string | null,
      };
    }
    if (state.kind === "disabled") {
      return {
        bg: "bg-zinc-100 dark:bg-zinc-900",
        text: "text-zinc-700 dark:text-zinc-300",
        border: "border-zinc-300 dark:border-zinc-800",
        dot: "bg-zinc-400",
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
        border: "border-red-300 dark:border-red-900",
        dot: "bg-red-500",
        Icon: WifiOff,
        iconAnimate: false,
        title: "Sin conexión",
        sub:
          state.lastSeenAgo !== null
            ? `Verifica que la PC de impresión esté prendida · última conexión hace ${formatAgo(state.lastSeenAgo)}`
            : "Verifica que la PC de impresión esté prendida",
      };
    }
    if (state.kind === "printer_problem") {
      const labels: Record<PrinterStatus, { title: string; sub: string }> = {
        offline: {
          title: "Impresora desconectada",
          sub: "Está apagada, sin cable USB o sin papel. Revísala físicamente.",
        },
        stopped: {
          title: "Cola de impresión detenida",
          sub: "Verifica el estado de la impresora en Windows.",
        },
        not_installed: {
          title: "Impresora no encontrada",
          sub: "Windows no reconoce la impresora configurada. Verifica el nombre en Configuración.",
        },
        error: {
          title: "Error con la impresora",
          sub: "Hay un problema con el driver o los permisos.",
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
        border: "border-amber-300 dark:border-amber-900",
        dot: "bg-amber-500",
        Icon: AlertTriangle,
        iconAnimate: false,
        title: l.title,
        sub: l.sub,
      };
    }
    return {
      bg: "bg-green-50 dark:bg-green-950/30",
      text: "text-green-800 dark:text-green-300",
      border: "border-green-300 dark:border-green-900",
      dot: "bg-green-500",
      Icon: Wifi,
      iconAnimate: false,
      title: "Impresora lista",
      sub: "Las etiquetas saldrán por la impresora automáticamente",
    };
  })();

  const { Icon, iconAnimate } = styles;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border}`}
      >
        <span className="relative inline-flex">
          <span
            className={`size-2 rounded-full ${styles.dot} ${state.kind === "ok" ? "animate-pulse" : ""}`}
          />
        </span>
        {styles.title}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${styles.bg} ${styles.text} ${styles.border}`}
    >
      <div className="relative shrink-0">
        <div className="size-12 rounded-full bg-white/60 dark:bg-black/30 flex items-center justify-center">
          <Icon className={`size-6 ${iconAnimate ? "animate-spin" : ""}`} />
        </div>
        {/* Punto de status arriba a la derecha del icono */}
        <span
          className={`absolute -top-0.5 -right-0.5 size-3.5 rounded-full ring-2 ring-background ${styles.dot} ${
            state.kind === "ok" ? "animate-pulse" : ""
          }`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base sm:text-lg font-bold leading-tight">
          {styles.title}
        </p>
        {styles.sub && (
          <p className="text-xs sm:text-sm opacity-80 mt-1 leading-snug">
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
