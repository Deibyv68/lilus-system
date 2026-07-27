import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { format } from "date-fns";

// 2 x 1 pulgadas — orientación natural (landscape, así se lee la etiqueta).
// El agente le dice al driver "orientation: landscape" para que no rote.
const LABEL_WIDTH = 2 * 72; // 144
const LABEL_HEIGHT = 1 * 72; // 72

// Cada etiqueta lleva TRES jabones: se corta con tijera por las dos líneas
// punteadas y quedan tres tiras. Sin el nombre del producto sobra espacio,
// y lo que importa para trazabilidad es el lote y las fechas.
export const UNITS_PER_LABEL = 3;

const PANEL_DEPTH = LABEL_WIDTH / UNITS_PER_LABEL; // 48 — ancho de cada tira
const PANEL_ACROSS = LABEL_HEIGHT; // 72 — largo de la tira, ya girada
const MARGIN = 3;
const INNER = PANEL_ACROSS - MARGIN * 2;

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
 * Cada tira se dibuja en su propio sistema de coordenadas "de lectura": el
 * origen es su esquina superior izquierda vista ya girada, `u` avanza hacia
 * la derecha y `v` hacia abajo. Esta función traduce ese punto a la página
 * real y dice con qué ángulo hay que escribir.
 *
 * Las tiras alternan orientación (normal, invertida, normal) para conservar
 * el efecto espejo del diseño original.
 */
function place(panel: number, u: number, v: number) {
  const x0 = panel * PANEL_DEPTH;
  const flipped = panel % 2 === 1;
  if (!flipped) {
    return { x: x0 + v, y: u, rot: degrees(90) };
  }
  return {
    x: x0 + PANEL_DEPTH - v,
    y: PANEL_ACROSS - u,
    rot: degrees(270),
  };
}

function drawPanelText(
  page: Page,
  panel: number,
  text: string,
  u: number,
  v: number,
  size: number,
  font: Font,
  color = rgb(0, 0, 0)
) {
  const { x, y, rot } = place(panel, u, v);
  page.drawText(text, { x, y, size, font, color, rotate: rot });
}

/** Igual que drawPanelText pero alineando el final del texto a `uEnd`. */
function drawPanelTextRight(
  page: Page,
  panel: number,
  text: string,
  uEnd: number,
  v: number,
  size: number,
  font: Font,
  color = rgb(0, 0, 0)
) {
  const w = font.widthOfTextAtSize(text, size);
  drawPanelText(page, panel, text, uEnd - w, v, size, font, color);
}

function drawPanelLine(page: Page, panel: number, u1: number, u2: number, v: number) {
  const a = place(panel, u1, v);
  const b = place(panel, u2, v);
  page.drawLine({
    start: { x: a.x, y: a.y },
    end: { x: b.x, y: b.y },
    thickness: 0.3,
    color: rgb(0.6, 0.6, 0.6),
  });
}

/** Dibuja el contenido de un jabón dentro de una de las tres tiras. */
function drawUnit(
  page: Page,
  panel: number,
  u: ExpiryLabelData,
  font: Font,
  bold: Font
) {
  // El lote va primero y en grande: es el dato de trazabilidad.
  drawPanelText(
    page,
    panel,
    truncate(u.batchCode, bold, 7.5, INNER),
    MARGIN,
    11,
    7.5,
    bold
  );

  drawPanelText(page, panel, truncate(u.sku, font, 5.5, INNER), MARGIN, 19, 5.5, font, GRAY);

  drawPanelLine(page, panel, MARGIN, PANEL_ACROSS - MARGIN, 22.5);

  drawPanelText(page, panel, "ELAB", MARGIN, 32, 5.5, bold, GRAY);
  drawPanelTextRight(
    page,
    panel,
    format(u.manufactureDate, "dd/MM/yyyy"),
    PANEL_ACROSS - MARGIN,
    32,
    7.5,
    bold
  );

  drawPanelText(page, panel, "VENCE", MARGIN, 43, 5.5, bold, GRAY);
  drawPanelTextRight(
    page,
    panel,
    format(u.expiryDate, "dd/MM/yyyy"),
    PANEL_ACROSS - MARGIN,
    43,
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

  // De tres en tres. Si el total no es múltiplo de 3, la última etiqueta
  // deja las tiras sobrantes en blanco.
  for (let i = 0; i < units.length; i += UNITS_PER_LABEL) {
    const page = pdf.addPage([LABEL_WIDTH, LABEL_HEIGHT]);

    // Líneas de corte punteadas entre tiras
    for (let c = 1; c < UNITS_PER_LABEL; c++) {
      page.drawLine({
        start: { x: c * PANEL_DEPTH, y: 2 },
        end: { x: c * PANEL_DEPTH, y: LABEL_HEIGHT - 2 },
        thickness: 0.5,
        color: CUT_GRAY,
        dashArray: [2.5, 2],
      });
    }

    for (let p = 0; p < UNITS_PER_LABEL; p++) {
      const unit = units[i + p];
      if (unit) drawUnit(page, p, unit, font, bold);
    }
  }

  return pdf.save();
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
