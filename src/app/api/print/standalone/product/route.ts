import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { pdfOrPngResponse } from "@/lib/pdf-response";

export const dynamic = "force-dynamic";

const MM_TO_PT = 2.83464567;

// Devuelve el PDF de la etiqueta circular de UN producto específico
// (sin necesidad de un pedido). Usado por la sección de etiquetas sueltas.
// Acepta: ?productId=X&copies=N&offsetX=mm&offsetY=mm
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const productId = req.nextUrl.searchParams.get("productId");
  if (!productId) {
    return new NextResponse("productId requerido", { status: 400 });
  }
  const copies = clamp(
    parseInt(req.nextUrl.searchParams.get("copies") ?? "1", 10) || 1,
    1,
    50
  );
  const offsetX =
    parseFloat(req.nextUrl.searchParams.get("offsetX") ?? "0") || 0;
  const offsetY =
    parseFloat(req.nextUrl.searchParams.get("offsetY") ?? "0") || 0;
  const xPt = Math.max(-50, Math.min(50, offsetX)) * MM_TO_PT;
  const yPt = Math.max(-50, Math.min(50, offsetY)) * MM_TO_PT;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, labelPdfUrl: true },
  });
  if (!product || !product.labelPdfUrl) {
    return new NextResponse(
      "El producto no tiene PDF de etiqueta cargado",
      { status: 404 }
    );
  }

  const filepath = path.join(process.cwd(), "public", product.labelPdfUrl);
  let srcBytes: Buffer;
  try {
    srcBytes = await readFile(filepath);
  } catch {
    return new NextResponse("Archivo de etiqueta no encontrado", {
      status: 404,
    });
  }
  const src = await PDFDocument.load(srcBytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());

  for (let i = 0; i < copies; i++) {
    for (const p of pages) {
      const added = out.addPage(p);
      if (xPt !== 0 || yPt !== 0) {
        added.translateContent(xPt, yPt);
      }
    }
  }

  const bytes = await out.save();
  return pdfOrPngResponse(bytes, {
    format,
    filename: `producto-${productId}.pdf`,
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
