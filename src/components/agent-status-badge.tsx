"use client";

import { useEffect, useState } from "react";
import { Printer, Wifi, WifiOff, PowerOff } from "lucide-react";

type State =
  | { kind: "loading" }
  | { kind: "disabled" }
  | { kind: "online" }
  | { kind: "offline"; lastSeenAgo: number | null };

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
          online: boolean;
          lastSeenAgo: number | null;
        };
        if (cancelled) return;
        if (!data.enabled) {
          setState({ kind: "disabled" });
        } else if (data.online) {
          setState({ kind: "online" });
        } else {
          setState({ kind: "offline", lastSeenAgo: data.lastSeenAgo });
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
        Icon: Printer,
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
        title: "Impresora desactivada",
        sub: "Actívala en Configuración → Agente de impresión",
      };
    }
    if (state.kind === "online") {
      return {
        bg: "bg-green-50 dark:bg-green-950/30",
        text: "text-green-800 dark:text-green-300",
        border: "border-green-200 dark:border-green-900",
        Icon: Wifi,
        title: "Impresora lista",
        sub: "Las etiquetas saldrán por la MUNBYN automáticamente",
      };
    }
    return {
      bg: "bg-red-50 dark:bg-red-950/30",
      text: "text-red-800 dark:text-red-300",
      border: "border-red-200 dark:border-red-900",
      Icon: WifiOff,
      title: "Sin conexión con la impresora",
      sub:
        state.lastSeenAgo !== null
          ? `Última vez activa hace ${formatAgo(state.lastSeenAgo)}`
          : "Verifica que la PC del 1er piso esté prendida",
    };
  })();

  const { Icon } = styles;

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${styles.bg} ${styles.text} ${styles.border}`}
      >
        <Icon className="size-3" />
        {styles.title}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${styles.bg} ${styles.text} ${styles.border}`}
    >
      <div className="size-9 rounded-full bg-white/40 dark:bg-black/20 flex items-center justify-center shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{styles.title}</p>
        {styles.sub && (
          <p className="text-[11px] opacity-80 mt-0.5 truncate">{styles.sub}</p>
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
