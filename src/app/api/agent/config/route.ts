import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAgentToken } from "@/lib/print-queue";

export const dynamic = "force-dynamic";

// Devuelve la config del agente que el server conoce (nombre de impresora, etc.)
// para que el agente pueda hacer self-checks sin necesidad de configurarlo todo
// dos veces.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!(await validateAgentToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const setting = await prisma.setting.findUnique({
    where: { key: "print_agent_printer" },
  });
  return NextResponse.json({
    printerName: setting?.value ?? null,
  });
}
