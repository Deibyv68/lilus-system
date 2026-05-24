import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Threshold: si no hemos visto al agente en los últimos 10s,
// lo consideramos desconectado (polling default es 2s).
const STALE_THRESHOLD_MS = 10_000;

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "agent_last_seen",
          "print_agent_enabled",
          "agent_printer_status",
        ],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const enabled = map.print_agent_enabled === "true";
  const lastSeenStr = map.agent_last_seen;
  let agentOnline = false;
  let lastSeenAgo: number | null = null;

  if (lastSeenStr) {
    const lastSeen = new Date(lastSeenStr).getTime();
    const now = Date.now();
    lastSeenAgo = now - lastSeen;
    agentOnline = lastSeenAgo < STALE_THRESHOLD_MS;
  }

  // Si el agente está caído, no importa el status reportado de impresora
  // (es viejo, no representa la realidad actual).
  const rawPrinterStatus = agentOnline
    ? (map.agent_printer_status ?? "unknown")
    : "unknown";

  return NextResponse.json({
    enabled,
    agentOnline,
    // Compat: el frontend antiguo lee "online" como agente conectado
    online: agentOnline,
    lastSeenAgo,
    lastSeenAt: lastSeenStr ?? null,
    printerStatus: rawPrinterStatus,
  });
}
