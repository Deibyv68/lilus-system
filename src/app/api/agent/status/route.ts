import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Threshold: si no hemos visto al agente en los últimos 10s,
// lo consideramos desconectado (polling default es 2s).
const STALE_THRESHOLD_MS = 10_000;

export async function GET() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["agent_last_seen", "print_agent_enabled"] } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const enabled = map.print_agent_enabled === "true";
  const lastSeenStr = map.agent_last_seen;
  let online = false;
  let lastSeenAgo: number | null = null;

  if (lastSeenStr) {
    const lastSeen = new Date(lastSeenStr).getTime();
    const now = Date.now();
    lastSeenAgo = now - lastSeen;
    online = lastSeenAgo < STALE_THRESHOLD_MS;
  }

  return NextResponse.json({
    enabled,
    online,
    lastSeenAgo,
    lastSeenAt: lastSeenStr ?? null,
  });
}
