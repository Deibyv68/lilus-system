import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateAgentToken,
  agentHasPrinter,
  STALE_JOB_MS,
} from "@/lib/print-queue";

export const dynamic = "force-dynamic";

/**
 * El agente pregunta cada 2 segundos si hay algo que imprimir.
 *
 * La impresora es una sola y va cambiando de computadora, así que la
 * regla es: **solo se le entrega trabajo al agente que la tiene
 * enchufada ahora**. El que no la ve se va con las manos vacías aunque
 * la cola esté llena. Eso es lo que hace que la etiqueta salga donde
 * está el papel sin que nadie tenga que elegir el destino.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!(await validateAgentToken(token))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Los agentes viejos no mandan nombre. Se les da uno para que no
  // compitan todos por la misma fila de la tabla.
  const agentName =
    req.nextUrl.searchParams.get("agent")?.trim() || "agente-sin-nombre";
  const printerStatus = req.nextUrl.searchParams.get("printer") || "unknown";
  const printerName = req.nextUrl.searchParams.get("printerName") || null;

  await prisma.printAgent.upsert({
    where: { name: agentName },
    update: { printerStatus, printerName, lastSeenAt: new Date() },
    create: { name: agentName, printerStatus, printerName },
  });

  // Trabajos que quedaron colgados porque la impresora no estaba
  // enchufada en ninguna parte. Sin esto, mañana al conectarla saldrían
  // de golpe todas las etiquetas de ayer.
  await prisma.printJob.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(Date.now() - STALE_JOB_MS) },
    },
    data: {
      status: "FAILED",
      error:
        "Se venció esperando: ninguna PC tuvo la impresora conectada a tiempo.",
      finishedAt: new Date(),
    },
  });

  if (!agentHasPrinter(printerStatus)) {
    return new NextResponse(null, { status: 204 });
  }

  // Tomar el trabajo con un update condicionado en vez de leer y después
  // escribir: si los dos agentes tienen impresora en el mismo instante
  // (durante el cambio de cable), el segundo ve count 0 y sigue de largo
  // en lugar de imprimir el duplicado.
  for (let intento = 0; intento < 5; intento++) {
    const next = await prisma.printJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
    if (!next) return new NextResponse(null, { status: 204 });

    const claimed = await prisma.printJob.updateMany({
      where: { id: next.id, status: "PENDING" },
      data: { status: "PICKED_UP", pickedAt: new Date(), agentName },
    });
    if (claimed.count !== 1) continue; // se lo llevó el otro, probar el siguiente

    return NextResponse.json({
      id: next.id,
      kind: next.kind,
      printerName: next.printerName,
      copies: next.copies,
      pdfBase64: next.pdfBase64,
    });
  }

  return new NextResponse(null, { status: 204 });
}
