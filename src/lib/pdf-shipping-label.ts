import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { generateBarcodePng } from "./barcode";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Tamaño 4x6 pulgadas en puntos (1 pt = 1/72 pulgada)
const LABEL_WIDTH = 4 * 72; // 288
const LABEL_HEIGHT = 6 * 72; // 432
const MARGIN = 14;

export type ShippingLabelData = {
  orderNumber: string;
  carrier: string;
  sender: {
    name: string;
    cedula?: string;
    phone?: string;
    email?: string;
    city?: string;
    province?: string;
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

  // ── Header con sello LILUS + transportadora ──
  // Sello (line-art, black on transparent) a la izquierda
  const LOGO_SIZE = 36; // pt (~13mm)
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "brand",
      "lilus-logo-label.png"
    );
    const logoBytes = await readFile(logoPath);
    const logoImage = await pdf.embedPng(logoBytes);
    page.drawImage(logoImage, {
      x: MARGIN,
      y: y - LOGO_SIZE,
      width: LOGO_SIZE,
      height: LOGO_SIZE,
    });
  } catch {
    // si no está el PNG, seguimos sin logo (fallback)
  }

  // Texto LILUS al lado del sello
  page.drawText("LILUS", {
    x: MARGIN + LOGO_SIZE + 6,
    y: y - 22,
    size: 20,
    font: bold,
    color: black,
  });
  page.drawText("Cuidado natural", {
    x: MARGIN + LOGO_SIZE + 6,
    y: y - 32,
    size: 7,
    font,
    color: gray,
  });

  // Transportadora a la derecha
  page.drawText(data.carrier.toUpperCase(), {
    x: LABEL_WIDTH - MARGIN - bold.widthOfTextAtSize(data.carrier.toUpperCase(), 10),
    y: y - 12,
    size: 10,
    font: bold,
  });
  y -= Math.max(LOGO_SIZE, 28) + 4;

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
  if (data.sender.cedula) {
    page.drawText(`CI/RUC: ${data.sender.cedula}`, {
      x: MARGIN,
      y,
      size: 8,
      font,
    });
    y -= 10;
  }
  if (data.sender.city || data.sender.province) {
    const cityLine = [data.sender.city, data.sender.province]
      .filter(Boolean)
      .join(", ");
    page.drawText(cityLine, { x: MARGIN, y, size: 9, font });
    y -= 11;
  }
  const addrLinesS = drawWrapped(
    page,
    data.sender.address,
    MARGIN,
    y,
    LABEL_WIDTH - MARGIN * 2,
    9,
    font
  );
  y -= addrLinesS * 11;
  if (data.sender.phone) {
    page.drawText(`Tel: ${data.sender.phone}`, { x: MARGIN, y, size: 9, font });
    y -= 11;
  }
  if (data.sender.email) {
    page.drawText(data.sender.email, { x: MARGIN, y, size: 8, font, color: gray });
    y -= 10;
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
