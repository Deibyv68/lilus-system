import { NextRequest, NextResponse } from "next/server";
import { enqueuePrintJob, type PrintKind } from "@/lib/print-queue";
import { denyIfAnonymous } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Encola impresión de un pedido real. Solo desde adentro.
  const denegado = await denyIfAnonymous();
  if (denegado) return denegado;

  const { id } = await params;
  let body: {
    kind?: PrintKind;
    copies?: number;
    offsetX?: number;
    offsetY?: number;
    unitIndex?: number;
  } = {};
  try {
    body = await req.json();
  } catch {}

  if (!body.kind) {
    return NextResponse.json({ error: "kind requerido" }, { status: 400 });
  }

  try {
    const job = await enqueuePrintJob({
      orderId: id,
      kind: body.kind,
      copies: body.copies,
      options: {
        offsetX: body.offsetX,
        offsetY: body.offsetY,
        unitIndex: body.unitIndex,
      },
    });
    return NextResponse.json({ ok: true, jobId: job.id });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
}
