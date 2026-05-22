import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAgentToken } from "@/lib/print-queue";

export const dynamic = "force-dynamic";

// Agente hace polling cada N segundos.
// Devuelve UN trabajo pendiente (FIFO) y lo marca como PICKED_UP.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!(await validateAgentToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Atómico: encuentra el más viejo PENDING y márcalo PICKED_UP
  const next = await prisma.printJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  if (!next) {
    return new NextResponse(null, { status: 204 });
  }

  await prisma.printJob.update({
    where: { id: next.id },
    data: { status: "PICKED_UP", pickedAt: new Date() },
  });

  return NextResponse.json({
    id: next.id,
    kind: next.kind,
    printerName: next.printerName,
    copies: next.copies,
    pdfBase64: next.pdfBase64,
  });
}
