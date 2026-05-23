import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";

// 2 x 1 pulgadas — orientación natural (landscape, así se lee la etiqueta).
// El agente le dice al driver "orientation: landscape" para que no rote.
const LABEL_WIDTH = 2 * 72; // 144
const LABEL_HEIGHT = 1 * 72; // 72
const MARGIN = 4;

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
    const page = pdf.addPage([LABEL_WIDTH, LABEL_HEIGHT]);

    const nameSize = 9;
    const nameMax = LABEL_WIDTH - MARGIN * 2;
    const name = truncate(u.productName, bold, nameSize, nameMax);
    page.drawText(name, {
      x: MARGIN,
      y: LABEL_HEIGHT - MARGIN - nameSize - 1,
      size: nameSize,
      font: bold,
    });

    page.drawText(u.sku, {
      x: MARGIN,
      y: LABEL_HEIGHT - MARGIN - nameSize - 13,
      size: 6.5,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    const lotW = font.widthOfTextAtSize(u.batchCode, 6.5);
    page.drawText(u.batchCode, {
      x: LABEL_WIDTH - MARGIN - lotW,
      y: LABEL_HEIGHT - MARGIN - nameSize - 13,
      size: 6.5,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    page.drawLine({
      start: { x: MARGIN, y: LABEL_HEIGHT - MARGIN - nameSize - 17 },
      end: { x: LABEL_WIDTH - MARGIN, y: LABEL_HEIGHT - MARGIN - nameSize - 17 },
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
      x: LABEL_WIDTH - MARGIN - venceW,
      y: 22,
      size: 6,
      font: bold,
      color: rgb(0.35, 0.35, 0.35),
    });
    const expText = format(u.expiryDate, "dd/MM/yyyy");
    const expW = bold.widthOfTextAtSize(expText, 9);
    page.drawText(expText, {
      x: LABEL_WIDTH - MARGIN - expW,
      y: 12,
      size: 9,
      font: bold,
    });
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
