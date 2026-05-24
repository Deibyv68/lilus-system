import { pdfToPng } from "pdf-to-png-converter";

/**
 * Convierte un Buffer de PDF a PNG (primera página).
 *
 * @param pdfBuffer Buffer con el PDF
 * @param scale Multiplicador del viewport. 2 = doble resolución (recomendado
 *              para que se vea nítido en pantallas Retina sin ser enorme).
 *              Defaults: 2.0
 * @returns Buffer del PNG (primera página)
 */
export async function renderPdfToPng(
  pdfBuffer: Buffer | Uint8Array,
  scale: number = 2.0
): Promise<Buffer> {
  const buf = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
  const pages = await pdfToPng(buf, {
    viewportScale: scale,
    pagesToProcess: [1],
    verbosityLevel: 0,
  });
  const first = pages[0];
  if (!first || !first.content) throw new Error("PDF sin páginas");
  return first.content;
}
