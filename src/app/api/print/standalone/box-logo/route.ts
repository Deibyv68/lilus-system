import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { pdfOrPngResponse } from "@/lib/pdf-response";

export const dynamic = "force-dynamic";

// Devuelve el PDF del sello LILUS para etiqueta circular 2×2
// (sin necesidad de un pedido). Acepta: ?copies=N
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const copies = clamp(
    parseInt(req.nextUrl.searchParams.get("copies") ?? "1", 10) || 1,
    1,
    50
  );

  const logoPath = path.join(
    process.cwd(),
    "public",
    "brand",
    "lilus-logo.pdf"
  );
  const logoBytes = await readFile(logoPath);
  const logoDoc = await PDFDocument.load(logoBytes);
  const out = await PDFDocument.create();
  const [logoPage] = await out.embedPdf(logoDoc, [0]);

  const sizePt = 2 * 72;
  const origW = logoPage.width;
  const origH = logoPage.height;
  const scale = (sizePt * 0.9) / Math.max(origW, origH);
  const drawW = origW * scale;
  const drawH = origH * scale;
  const ox = (sizePt - drawW) / 2;
  const oy = (sizePt - drawH) / 2;

  for (let i = 0; i < copies; i++) {
    const page = out.addPage([sizePt, sizePt]);
    page.drawPage(logoPage, { x: ox, y: oy, width: drawW, height: drawH });
  }

  const bytes = await out.save();
  return pdfOrPngResponse(bytes, {
    format,
    filename: `lilus-logo.pdf`,
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
