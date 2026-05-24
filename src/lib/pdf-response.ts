import { NextResponse } from "next/server";
import { renderPdfToPng } from "./pdf-to-png";

/**
 * Helper que devuelve un PDF como NextResponse, con soporte automático
 * de format=png para convertir a PNG (usado en previews).
 */
export async function pdfOrPngResponse(
  pdfBytes: Uint8Array | Buffer,
  options: {
    format: string | null; // "png" para PNG, cualquier otra cosa = PDF
    filename: string;
    extraHeaders?: Record<string, string>;
  }
): Promise<NextResponse> {
  const buf = Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes);

  if (options.format === "png") {
    const png = await renderPdfToPng(buf, 2);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        ...options.extraHeaders,
      },
    });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${options.filename}"`,
      ...options.extraHeaders,
    },
  });
}
