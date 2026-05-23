import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lámina cuadrada para sticker en caja. Default 2×2 pulgadas (mismo
// rollo que las etiquetas de producto). Si se requiere otro tamaño,
// usar ?size=N en la URL.
const DEFAULT_SIZE_IN = 2;
const PT_PER_IN = 72;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sizeIn = clamp(
    parseFloat(req.nextUrl.searchParams.get("size") ?? String(DEFAULT_SIZE_IN)) ||
      DEFAULT_SIZE_IN,
    2,
    6
  );
  const copies = clamp(
    parseInt(req.nextUrl.searchParams.get("copies") ?? "0", 10) || 0,
    0,
    20
  );

  // Verificar que el pedido exista y cuántos packs contiene
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return new NextResponse("Pedido no encontrado", { status: 404 });

  const packCount = order.items
    .filter((i) => i.packId)
    .reduce((sum, i) => sum + i.quantity, 0);

  // Cuántas copias imprimir: param explícito > nº de packs > 1
  const totalCopies = copies > 0 ? copies : Math.max(1, packCount);

  // Cargar el PDF del logo
  const logoPath = path.join(process.cwd(), "public", "brand", "lilus-logo.pdf");
  const logoBytes = await readFile(logoPath);
  const logoDoc = await PDFDocument.load(logoBytes);

  const out = await PDFDocument.create();
  const [logoPage] = await out.embedPdf(logoDoc, [0]);

  const sizePt = sizeIn * PT_PER_IN;

  // Tamaño del logo original (probablemente cuadrado)
  const origW = logoPage.width;
  const origH = logoPage.height;
  // Escalar para que quepa con un pequeño margen (90% del lado más corto)
  const scale = (sizePt * 0.9) / Math.max(origW, origH);
  const drawW = origW * scale;
  const drawH = origH * scale;
  const offsetX = (sizePt - drawW) / 2;
  const offsetY = (sizePt - drawH) / 2;

  for (let i = 0; i < totalCopies; i++) {
    const page = out.addPage([sizePt, sizePt]);
    page.drawPage(logoPage, {
      x: offsetX,
      y: offsetY,
      width: drawW,
      height: drawH,
    });
  }

  const pdfBytes = await out.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-caja.pdf"`,
    },
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
