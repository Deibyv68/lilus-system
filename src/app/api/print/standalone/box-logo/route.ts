import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { pdfOrPngResponse } from "@/lib/pdf-response";

export const dynamic = "force-dynamic";

const MM_TO_PT = 2.83464567;

// Devuelve el PDF del sello LILUS para etiqueta circular 2×2
// (sin necesidad de un pedido). Acepta: ?copies=N&offsetX=mm&offsetY=mm
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format");
  const copies = clamp(
    parseInt(req.nextUrl.searchParams.get("copies") ?? "1", 10) || 1,
    1,
    50
  );
  const offsetXmm =
    parseFloat(req.nextUrl.searchParams.get("offsetX") ?? "0") || 0;
  const offsetYmm =
    parseFloat(req.nextUrl.searchParams.get("offsetY") ?? "0") || 0;
  const offsetXpt = Math.max(-50, Math.min(50, offsetXmm)) * MM_TO_PT;
  const offsetYpt = Math.max(-50, Math.min(50, offsetYmm)) * MM_TO_PT;

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
    page.drawPage(logoPage, {
      x: ox + offsetXpt,
      y: oy + offsetYpt,
      width: drawW,
      height: drawH,
    });
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
