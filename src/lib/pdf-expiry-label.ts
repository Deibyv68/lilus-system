import {
  PDFDocument,
  StandardFonts,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  translate,
  rotateRadians,
} from "pdf-lib";
import { format } from "date-fns";

// Dimensiones físicas de la etiqueta (cómo se ve cuando la sostienes "bien"):
//   2 pulgadas de ancho × 1 pulgada de alto (landscape)
const LANDSCAPE_W = 2 * 72; // 144 pt
const LANDSCAPE_H = 1 * 72; // 72 pt
const MARGIN = 4;

// La impresora térmica alimenta el rollo con el lado de 1" perpendicular al
// avance del papel. Por eso el PDF tiene que tener dimensiones de página
// PORTRAIT (1" × 2"), pero el contenido debe estar rotado para leerse
// horizontal cuando la etiqueta se sostiene en orientación normal (landscape).
const PAGE_W = LANDSCAPE_H; // 72
const PAGE_H = LANDSCAPE_W; // 144

export type ExpiryLabelData = {
  productName: string;
  sku: string;
  batchCode: string;
  manufactureDate: Date;
  expiryDate: Date;
};

export async function buildExpiryLabelPdf(
  units: ExpiryLabelData[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const u of units) {
    const page = pdf.addPage([PAGE_W, PAGE_H]);

    // ── Transformación: dibujar como si fuera landscape ──
    // Trasladamos el origen al "top-left" del landscape virtual y rotamos
    // 90° en sentido horario. Después de esto, las coordenadas del usuario
    // son (landscape_x, landscape_y) donde:
    //   - landscape_x ∈ [0, 144] (ancho landscape)
    //   - landscape_y ∈ [0, 72]  (alto landscape)
    // y la página físicamente sigue siendo portrait 72×144.
    page.pushOperators(pushGraphicsState());
    page.pushOperators(translate(0, PAGE_H));
    page.pushOperators(rotateRadians(-Math.PI / 2));

    // ── Layout en coordenadas "landscape" ──
    const nameSize = 9;
    const nameMax = LANDSCAPE_W - MARGIN * 2;
    const name = truncate(u.productName, bold, nameSize, nameMax);

    page.drawText(name, {
      x: MARGIN,
      y: LANDSCAPE_H - MARGIN - nameSize - 1,
      size: nameSize,
      font: bold,
    });

    page.drawText(u.sku, {
      x: MARGIN,
      y: LANDSCAPE_H - MARGIN - nameSize - 13,
      size: 6.5,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    const lotW = font.widthOfTextAtSize(u.batchCode, 6.5);
    page.drawText(u.batchCode, {
      x: LANDSCAPE_W - MARGIN - lotW,
      y: LANDSCAPE_H - MARGIN - nameSize - 13,
      size: 6.5,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawLine({
      start: { x: MARGIN, y: LANDSCAPE_H - MARGIN - nameSize - 17 },
      end: { x: LANDSCAPE_W - MARGIN, y: LANDSCAPE_H - MARGIN - nameSize - 17 },
      thickness: 0.3,
      color: rgb(0.6, 0.6, 0.6),
    });

    page.drawText("ELAB", {
      x: MARGIN,
      y: 22,
      size: 6,
      font: bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    page.drawText(format(u.manufactureDate, "dd/MM/yyyy"), {
      x: MARGIN,
      y: 12,
      size: 9,
      font: bold,
    });

    const venceLabel = "VENCE";
    const venceW = bold.widthOfTextAtSize(venceLabel, 6);
    page.drawText(venceLabel, {
      x: LANDSCAPE_W - MARGIN - venceW,
      y: 22,
      size: 6,
      font: bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    const expText = format(u.expiryDate, "dd/MM/yyyy");
    const expW = bold.widthOfTextAtSize(expText, 9);
    page.drawText(expText, {
      x: LANDSCAPE_W - MARGIN - expW,
      y: 12,
      size: 9,
      font: bold,
    });

    page.pushOperators(popGraphicsState());
  }

  return pdf.save();
}

function truncate(
  text: string,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  size: number,
  maxWidth: number
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (
    truncated.length > 0 &&
    font.widthOfTextAtSize(truncated + "…", size) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}
