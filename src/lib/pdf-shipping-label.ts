import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateBarcodePng } from "./barcode";

// Tamaño 4x6 pulgadas en puntos (1 pt = 1/72 pulgada)
const LABEL_WIDTH = 4 * 72; // 288
const LABEL_HEIGHT = 6 * 72; // 432
const MARGIN = 14;

export type ShippingLabelData = {
  orderNumber: string;
  carrier: string;
  sender: {
    name: string;
    phone?: string;
    address: string;
  };
  recipient: {
    name: string;
    cedula?: string;
    phone?: string;
    address: string;
    city: string;
    province: string;
    reference?: string;
  };
  itemsSummary: string; // ej "2× Pack Relax · 1× Jabón Lavanda"
  itemCount: number;
  weightGrams?: number;
};

export async function buildShippingLabelPdf(
  data: ShippingLabelData
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([LABEL_WIDTH, LABEL_HEIGHT]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = LABEL_HEIGHT - MARGIN;

  // Header con marca y transportadora
  page.drawText("LILUS", {
    x: MARGIN,
    y: y - 18,
    size: 22,
    font: bold,
    color: black,
  });
  page.drawText(data.carrier.toUpperCase(), {
    x: LABEL_WIDTH - MARGIN - bold.widthOfTextAtSize(data.carrier.toUpperCase(), 10),
    y: y - 12,
    size: 10,
    font: bold,
  });
  y -= 28;

  // Línea separadora
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LABEL_WIDTH - MARGIN, y },
    thickness: 1,
    color: black,
  });
  y -= 10;

  // Remitente
  page.drawText("REMITE", { x: MARGIN, y, size: 8, font: bold, color: gray });
  y -= 11;
  page.drawText(data.sender.name, { x: MARGIN, y, size: 10, font: bold });
  y -= 11;
  drawWrapped(page, data.sender.address, MARGIN, y, LABEL_WIDTH - MARGIN * 2, 9, font);
  y -= 12;
  if (data.sender.phone) {
    page.drawText(`Tel: ${data.sender.phone}`, { x: MARGIN, y, size: 9, font });
    y -= 11;
  }

  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LABEL_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 10;

  // Destinatario (más prominente)
  page.drawText("DESTINATARIO", { x: MARGIN, y, size: 9, font: bold, color: gray });
  y -= 14;
  page.drawText(data.recipient.name, {
    x: MARGIN,
    y,
    size: 14,
    font: bold,
  });
  y -= 16;
  if (data.recipient.cedula) {
    page.drawText(`CI/RUC: ${data.recipient.cedula}`, {
      x: MARGIN,
      y,
      size: 9,
      font,
    });
    y -= 11;
  }
  page.drawText(`${data.recipient.city}, ${data.recipient.province}`, {
    x: MARGIN,
    y,
    size: 11,
    font: bold,
  });
  y -= 13;
  const addrLines = drawWrapped(
    page,
    data.recipient.address,
    MARGIN,
    y,
    LABEL_WIDTH - MARGIN * 2,
    10,
    font
  );
  y -= addrLines * 12;

  if (data.recipient.reference) {
    page.drawText("Referencia:", { x: MARGIN, y, size: 8, font: bold, color: gray });
    y -= 10;
    const refLines = drawWrapped(
      page,
      data.recipient.reference,
      MARGIN,
      y,
      LABEL_WIDTH - MARGIN * 2,
      9,
      font
    );
    y -= refLines * 11;
  }
  if (data.recipient.phone) {
    page.drawText(`Tel: ${data.recipient.phone}`, { x: MARGIN, y, size: 10, font: bold });
    y -= 12;
  }

  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: LABEL_WIDTH - MARGIN, y },
    thickness: 0.5,
    color: gray,
  });
  y -= 10;

  // Contenido y peso
  page.drawText("CONTENIDO", { x: MARGIN, y, size: 8, font: bold, color: gray });
  y -= 11;
  const itemLines = drawWrapped(
    page,
    data.itemsSummary,
    MARGIN,
    y,
    LABEL_WIDTH - MARGIN * 2,
    9,
    font
  );
  y -= itemLines * 11;

  page.drawText(
    `Piezas: ${data.itemCount}${
      data.weightGrams ? ` · ~${Math.round(data.weightGrams)} g` : ""
    }`,
    { x: MARGIN, y, size: 9, font }
  );
  y -= 12;

  // Barcode al final
  const barcodePng = await generateBarcodePng(data.orderNumber, {
    scale: 3,
    height: 18,
  });
  const img = await pdf.embedPng(barcodePng);
  const bcWidth = LABEL_WIDTH - MARGIN * 2;
  const bcHeight = 50;
  page.drawImage(img, {
    x: MARGIN,
    y: MARGIN + 14,
    width: bcWidth,
    height: bcHeight,
  });
  // Texto del número de orden bajo el barcode
  const labelText = data.orderNumber;
  const tw = bold.widthOfTextAtSize(labelText, 12);
  page.drawText(labelText, {
    x: (LABEL_WIDTH - tw) / 2,
    y: MARGIN,
    size: 12,
    font: bold,
  });

  return pdf.save();
}

function drawWrapped(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>
): number {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);

  let cy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: cy, size, font });
    cy -= size + 2;
  }
  return lines.length;
}
