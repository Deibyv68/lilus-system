import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { pdfOrPngResponse } from "@/lib/pdf-response";

export const dynamic = "force-dynamic";

// 1 mm = 2.83465 puntos PDF
const MM_TO_PT = 2.83464567;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const format = req.nextUrl.searchParams.get("format");
  const { id } = await params;
  const offsetXmm = parseFloat(req.nextUrl.searchParams.get("offsetX") ?? "0") || 0;
  const offsetYmm = parseFloat(req.nextUrl.searchParams.get("offsetY") ?? "0") || 0;
  const unitIndexParam = req.nextUrl.searchParams.get("unitIndex");
  const unitIndex =
    unitIndexParam !== null ? parseInt(unitIndexParam, 10) : null;
  // Clamp para evitar valores absurdos
  const xPt = Math.max(-50, Math.min(50, offsetXmm)) * MM_TO_PT;
  const yPt = Math.max(-50, Math.min(50, offsetYmm)) * MM_TO_PT;
  const allUnits = await prisma.productionUnit.findMany({
    where: { orderId: id },
    include: { product: true },
    orderBy: { batchCode: "asc" },
  });

  if (allUnits.length === 0) {
    return new NextResponse("Sin unidades", { status: 404 });
  }

  // Modo "una a una": filtrar a la unidad específica
  const units =
    unitIndex !== null && !isNaN(unitIndex)
      ? allUnits.slice(unitIndex, unitIndex + 1)
      : allUnits;
  if (units.length === 0) {
    return new NextResponse("Índice fuera de rango", { status: 400 });
  }

  // Cache de páginas por productId (no re-leemos el mismo PDF varias veces)
  const cachedPages = new Map<string, Awaited<ReturnType<PDFDocument["copyPages"]>>>();
  const out = await PDFDocument.create();

  const missing: string[] = [];

  for (const unit of units) {
    const product = unit.product;
    if (!product.labelPdfUrl) {
      if (!missing.includes(product.sku)) missing.push(product.sku);
      continue;
    }

    if (!cachedPages.has(product.id)) {
      try {
        const filepath = path.join(process.cwd(), "public", product.labelPdfUrl);
        const bytes = await readFile(filepath);
        const src = await PDFDocument.load(bytes);
        const pages = await out.copyPages(src, src.getPageIndices());
        cachedPages.set(product.id, pages);
      } catch {
        if (!missing.includes(product.sku)) missing.push(product.sku);
        continue;
      }
    }

    const pages = cachedPages.get(product.id);
    if (pages) {
      for (const p of pages) {
        const added = out.addPage(p);
        if (xPt !== 0 || yPt !== 0) {
          added.translateContent(xPt, yPt);
        }
      }
    }
  }

  if (out.getPageCount() === 0) {
    return NextResponse.json(
      {
        error: "Ningún producto de este pedido tiene PDF de etiqueta cargado",
        missingSkus: missing,
      },
      { status: 404 }
    );
  }

  const bytes = await out.save();
  const res = await pdfOrPngResponse(bytes, {
    format,
    filename: `${id}-productos.pdf`,
  });
  if (missing.length > 0) {
    res.headers.set("X-Missing-Skus", missing.join(","));
  }
  return res;
}
