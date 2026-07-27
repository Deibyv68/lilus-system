import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { format } from "date-fns";

// 2 x 1 pulgadas — orientación natural (landscape, así se lee la etiqueta).
// El agente le dice al driver "orientation: landscape" para que no rote.
const LABEL_WIDTH = 2 * 72; // 144
const LABEL_HEIGHT = 1 * 72; // 72

// Cada etiqueta lleva DOS jabones: se corta por la mitad con tijera y queda
// una etiqueta cuadrada de 1x1 para cada uno. Las dos mitades van giradas
// 180° una respecto de la otra, tal como se pidió.
const PANEL = 72; // lado de cada mitad, en puntos (1 pulgada)
const MARGIN = 4;
const INNER = PANEL - MARGIN * 2; // ancho útil dentro de cada mitad

const GRAY = rgb(0.35, 0.35, 0.35);
const CUT_GRAY = rgb(0.55, 0.55, 0.55);

export type ExpiryLabelData = {
  productName: string;
  sku: string;
  batchCode: string;
  manufactureDate: Date;
  expiryDate: Date;
};

type Font = Awaited<ReturnType<PDFDocument["embedFont"]>>;
type Page = ReturnType<PDFDocument["addPage"]>;

/**
 * Cada mitad se dibuja en su propio sistema de coordenadas "de lectura":
 * el origen es la esquina superior izquierda de esa mitad vista ya girada,
 * `u` avanza hacia la derecha y `v` hacia abajo. Esta función traduce ese
 * punto a la página real y dice con qué ángulo hay que escribir.
 *
 * La mitad izquierda se lee girando el papel 90° en sentido horario; la
 * derecha, 90° antihorario. Por eso una va a 90° y la otra a 270°.
 */
function place(side: "left" | "right", u: number, v: number) {
  if (side === "left") {
    return { x: v, y: u, rot: degrees(90) };
  }
  return { x: LABEL_WIDTH - v, y: PANEL - u, rot: degrees(270) };
}

function drawPanelText(
  page: Page,
  side: "left" | "right",
  text: string,
  u: number,
  v: number,
  size: number,
  font: Font,
  color = rgb(0, 0, 0)
) {
  const { x, y, rot } = place(side, u, v);
  page.drawText(text, { x, y, size, font, color, rotate: rot });
}

/** Igual que drawPanelText pero alineando el final del texto a `uEnd`. */
function drawPanelTextRight(
  page: Page,
  side: "left" | "right",
  text: string,
  uEnd: number,
  v: number,
  size: number,
  font: Font,
  color = rgb(0, 0, 0)
) {
  const w = font.widthOfTextAtSize(text, size);
  drawPanelText(page, side, text, uEnd - w, v, size, font, color);
}

function drawPanelLine(
  page: Page,
  side: "left" | "right",
  u1: number,
  u2: number,
  v: number,
  color = rgb(0.6, 0.6, 0.6)
) {
  const a = place(side, u1, v);
  const b = place(side, u2, v);
  page.drawLine({
    start: { x: a.x, y: a.y },
    end: { x: b.x, y: b.y },
    thickness: 0.3,
    color,
  });
}

/** Dibuja el contenido de un jabón dentro de una de las dos mitades. */
function drawUnit(
  page: Page,
  side: "left" | "right",
  u: ExpiryLabelData,
  font: Font,
  bold: Font
) {
  // ── Bloque de arriba: nombre, SKU y lote ──
  // SKU y lote van en líneas separadas: juntos no caben en una pulgada
  // y se solapaban.
  const nameSize = 7;
  const nameLines = wrap(u.productName, bold, nameSize, INNER, 2);

  let v = MARGIN + nameSize;
  for (const line of nameLines) {
    drawPanelText(page, side, line, MARGIN, v, nameSize, bold);
    v += nameSize + 1;
  }

  v += 4;
  drawPanelText(page, side, u.sku, MARGIN, v, 5.5, font, GRAY);
  v += 7;
  drawPanelText(
    page,
    side,
    truncate(`Lote ${u.batchCode}`, font, 5.5, INNER),
    MARGIN,
    v,
    5.5,
    font,
    GRAY
  );

  // ── Bloque de abajo: fechas, ancladas al pie de la mitad ──
  // Anclarlas abajo mantiene todas las etiquetas iguales aunque el nombre
  // ocupe una o dos líneas.
  const venceV = PANEL - MARGIN - 2;
  const elabV = venceV - 11;

  drawPanelLine(page, side, MARGIN, PANEL - MARGIN, elabV - 9);

  drawPanelText(page, side, "ELAB", MARGIN, elabV, 5.5, bold, GRAY);
  drawPanelTextRight(
    page,
    side,
    format(u.manufactureDate, "dd/MM/yyyy"),
    PANEL - MARGIN,
    elabV,
    7.5,
    bold
  );

  drawPanelText(page, side, "VENCE", MARGIN, venceV, 5.5, bold, GRAY);
  drawPanelTextRight(
    page,
    side,
    format(u.expiryDate, "dd/MM/yyyy"),
    PANEL - MARGIN,
    venceV,
    7.5,
    bold
  );
}

export async function buildExpiryLabelPdf(
  units: ExpiryLabelData[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // De dos en dos. Si el total es impar, la última etiqueta lleva solo
  // la mitad izquierda ocupada.
  for (let i = 0; i < units.length; i += 2) {
    const page = pdf.addPage([LABEL_WIDTH, LABEL_HEIGHT]);

    // Línea de corte punteada al medio
    page.drawLine({
      start: { x: PANEL, y: 2 },
      end: { x: PANEL, y: LABEL_HEIGHT - 2 },
      thickness: 0.5,
      color: CUT_GRAY,
      dashArray: [2.5, 2],
    });

    const left = units[i];
    if (left) drawUnit(page, "left", left, font, bold);

    const right = units[i + 1];
    if (right) drawUnit(page, "right", right, font, bold);
  }

  return pdf.save();
}

/** Parte el texto en como mucho `maxLines` líneas que quepan en `maxWidth`. */
function wrap(
  text: string,
  font: Font,
  size: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Si sobró texto, recortamos la última línea con puntos suspensivos
  const used = lines.join(" ");
  if (used.length < text.length && lines.length > 0) {
    const last = lines.length - 1;
    lines[last] = truncate(lines[last] + "…", font, size, maxWidth);
  }
  return lines.length > 0 ? lines : [truncate(text, font, size, maxWidth)];
}

function truncate(
  text: string,
  font: Font,
  size: number,
  maxWidth: number
): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 0 && font.widthOfTextAtSize(out + "…", size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + "…";
}
