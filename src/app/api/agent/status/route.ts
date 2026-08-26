import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentsView } from "@/lib/print-queue";

export const dynamic = "force-dynamic";

/**
 * Estado del sistema de impresión.
 *
 * Devuelve el detalle por PC y además un resumen. El resumen es lo que
 * mira el chip de "impresora lista": con una sola impresora que se muda,
 * lo que importa no es qué PC la tiene sino que **alguna** la tenga.
 */
export async function GET() {
  const enabledSetting = await prisma.setting.findUnique({
    where: { key: "print_agent_enabled" },
  });
  const enabled = enabledSetting?.value === "true";

  const agents = await getAgentsView();

  const online = agents.filter((a) => a.online);
  const conImpresora = agents.find((a) => a.hasPrinter);
  const agentOnline = online.length > 0;

  // Si nadie tiene la impresora, se muestra el motivo del agente vivo que
  // esté más cerca de tenerla, para no decir solo "desconocido".
  const printerStatus = conImpresora
    ? conImpresora.printerStatus
    : (online.find((a) => a.printerStatus !== "unknown")?.printerStatus ??
      "unknown");

  const masReciente = agents[0] ?? null;

  return NextResponse.json({
    enabled,
    agentOnline,
    // Compat con el frontend que leía "online" como agente conectado
    online: agentOnline,
    printerStatus,
    printerReady: !!conImpresora,
    printerOn: conImpresora?.name ?? null,
    lastSeenAgo: masReciente?.lastSeenAgo ?? null,
    lastSeenAt: masReciente?.lastSeenAt ?? null,
    agents,
  });
}
