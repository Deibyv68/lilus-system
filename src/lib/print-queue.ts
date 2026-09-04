import { prisma } from "./prisma";
import { buildShippingLabelPdf } from "./pdf-shipping-label";
import { buildExpiryLabelPdf, UNITS_PER_LABEL } from "./pdf-expiry-label";
import { buildShippingItemsLines } from "./shipping-items-lines";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type PrintKind =
  | "shipping"
  | "product-labels"
  | "expiry-labels"
  | "box-logo";

const MM_TO_PT = 2.83464567;

function settingsToMap(settings: { key: string; value: string }[]) {
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}

async function getAgentSettings() {
  const settings = await prisma.setting.findMany();
  const map = settingsToMap(settings);
  return {
    token: map.print_agent_token ?? null,
    printerName: map.print_agent_printer ?? null,
    enabled: map.print_agent_enabled === "true",
  };
}

/**
 * Construye el PDF correspondiente al tipo solicitado.
 */
export async function buildPdfForJob(
  orderId: string,
  kind: PrintKind,
  options: {
    offsetX?: number;
    offsetY?: number;
    copies?: number;
    unitIndex?: number; // si se pasa, solo construir esa unidad (0-based)
  } = {}
): Promise<Buffer> {
  if (kind === "shipping") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        shippingAddress: true,
        carrier: true,
        items: {
          include: {
            pack: {
              include: {
                items: {
                  include: {
                    product: { select: { name: true, shortName: true } },
                  },
                },
              },
            },
          },
        },
        productionUnits: true,
      },
    });
    if (!order) throw new Error("Pedido no encontrado");
    const settings = await prisma.setting.findMany();
    const m = settingsToMap(settings);
    const bytes = await buildShippingLabelPdf({
      orderNumber: order.orderNumber,
      carrier: order.carrier?.name ?? "—",
      sender: {
        name: m.sender_name ?? "LILUS",
        cedula: m.sender_cedula || undefined,
        phone: m.sender_phone || undefined,
        email: m.sender_email || undefined,
        city: m.sender_city || undefined,
        province: m.sender_province || undefined,
        address: m.sender_address ?? "Quito, Ecuador",
      },
      recipient: {
        name: order.customer.name,
        cedula: order.customer.cedula ?? undefined,
        phone: order.customer.phone ?? undefined,
        address: order.shippingAddress?.address ?? "",
        city: order.shippingAddress?.city ?? "",
        province: order.shippingAddress?.province ?? "",
        reference: order.shippingAddress?.reference ?? undefined,
      },
      itemsLines: buildShippingItemsLines(order.items),
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      weightGrams: order.productionUnits.length * 80,
    });
    return Buffer.from(bytes);
  }

  if (kind === "expiry-labels") {
    const units = await prisma.productionUnit.findMany({
      where: { orderId },
      orderBy: { batchCode: "asc" },
    });
    if (units.length === 0) throw new Error("Sin unidades para imprimir");
    // Cada etiqueta 2x1 lleva varios jabones, así que unitIndex identifica
    // una etiqueta (un grupo de unidades), no una unidad suelta.
    const selectedUnits =
      typeof options.unitIndex === "number"
        ? units.slice(
            options.unitIndex * UNITS_PER_LABEL,
            options.unitIndex * UNITS_PER_LABEL + UNITS_PER_LABEL
          )
        : units;
    if (selectedUnits.length === 0)
      throw new Error("Índice de unidad fuera de rango");
    const bytes = await buildExpiryLabelPdf(
      selectedUnits.map((u) => ({
        productName: u.productName,
        sku: u.productSku,
        batchCode: u.batchCode,
        manufactureDate: u.manufactureDate,
        expiryDate: u.expiryDate,
      }))
    );
    return Buffer.from(bytes);
  }

  if (kind === "product-labels") {
    const allUnits = await prisma.productionUnit.findMany({
      where: { orderId },
      include: { product: true },
      orderBy: { batchCode: "asc" },
    });
    if (allUnits.length === 0) throw new Error("Sin unidades");

    // Modo "una a una": filtrar a la unidad específica
    const units =
      typeof options.unitIndex === "number"
        ? allUnits.slice(options.unitIndex, options.unitIndex + 1)
        : allUnits;
    if (units.length === 0)
      throw new Error("Índice de unidad fuera de rango");

    const xPt = (options.offsetX ?? 0) * MM_TO_PT;
    const yPt = (options.offsetY ?? 0) * MM_TO_PT;

    const cachedPages = new Map<
      string,
      Awaited<ReturnType<PDFDocument["copyPages"]>>
    >();
    const out = await PDFDocument.create();

    for (const unit of units) {
      const product = unit.product;
      if (!product.labelPdfUrl) continue;
      if (!cachedPages.has(product.id)) {
        try {
          const filepath = path.join(process.cwd(), "public", product.labelPdfUrl);
          const bytes = await readFile(filepath);
          const src = await PDFDocument.load(bytes);
          const pages = await out.copyPages(src, src.getPageIndices());
          cachedPages.set(product.id, pages);
        } catch {
          continue;
        }
      }
      const pages = cachedPages.get(product.id);
      if (pages) {
        for (const p of pages) {
          const added = out.addPage(p);
          if (xPt !== 0 || yPt !== 0) {
            added.translateContent(xPt, yPt);
          }
        }
      }
    }

    if (out.getPageCount() === 0)
      throw new Error("Ningún producto tiene PDF cargado");
    return Buffer.from(await out.save());
  }

  if (kind === "box-logo") {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Pedido no encontrado");
    const packCount = order.items
      .filter((i) => i.packId)
      .reduce((sum, i) => sum + i.quantity, 0);
    const totalCopies = options.copies ?? Math.max(1, packCount);

    const logoPath = path.join(process.cwd(), "public", "brand", "lilus-logo.pdf");
    const logoBytes = await readFile(logoPath);
    const logoDoc = await PDFDocument.load(logoBytes);
    const out = await PDFDocument.create();
    const [logoPage] = await out.embedPdf(logoDoc, [0]);

    const sizePt = 2 * 72; // 2"x2" — mismo sticker que las etiquetas de producto
    const origW = logoPage.width;
    const origH = logoPage.height;
    const scale = (sizePt * 0.9) / Math.max(origW, origH);
    const drawW = origW * scale;
    const drawH = origH * scale;
    const ox = (sizePt - drawW) / 2;
    const oy = (sizePt - drawH) / 2;

    // Offset compartido con product-labels (mismo sticker físico)
    const userOffsetXpt = (options.offsetX ?? 0) * MM_TO_PT;
    const userOffsetYpt = (options.offsetY ?? 0) * MM_TO_PT;

    for (let i = 0; i < totalCopies; i++) {
      const page = out.addPage([sizePt, sizePt]);
      page.drawPage(logoPage, {
        x: ox + userOffsetXpt,
        y: oy + userOffsetYpt,
        width: drawW,
        height: drawH,
      });
    }
    return Buffer.from(await out.save());
  }

  throw new Error(`Tipo de impresión no soportado: ${kind}`);
}

export async function enqueuePrintJob(args: {
  orderId: string;
  kind: PrintKind;
  copies?: number;
  options?: { offsetX?: number; offsetY?: number; unitIndex?: number };
}) {
  const { printerName, enabled } = await getAgentSettings();
  if (!enabled) throw new Error("El agente de impresión no está habilitado");
  if (!printerName)
    throw new Error("Falta configurar el nombre de la impresora");

  const pdfBuffer = await buildPdfForJob(args.orderId, args.kind, {
    ...(args.options ?? {}),
    copies: args.copies,
  });

  const job = await prisma.printJob.create({
    data: {
      orderId: args.orderId,
      kind: args.kind,
      printerName,
      copies: args.copies ?? 1,
      pdfBase64: pdfBuffer.toString("base64"),
      status: "PENDING",
    },
  });
  return job;
}

export async function validateAgentToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const expected = (await prisma.setting.findUnique({
    where: { key: "print_agent_token" },
  }))?.value;
  return !!expected && expected === token;
}

// ──────────────────────────────────────────────────────────
// Agentes
//
// La impresora es una sola y va cambiando de PC. Cada agente reporta si
// la ve enchufada, y de ahí sale a quién se le entregan los trabajos.
// ──────────────────────────────────────────────────────────

/** Sin noticias en este lapso, damos al agente por caído (hace poll cada 2 s). */
export const AGENT_STALE_MS = 10_000;

/**
 * Cada cuánto se ESCRIBE el latido del agente, como mucho.
 *
 * ── Por qué no en cada pregunta ──
 *
 * El agente pregunta si hay algo que imprimir cada 2 segundos, y hasta
 * ahora cada pregunta actualizaba su fila: 43.000 escrituras al día por
 * computadora sin que nadie imprimiera nada. Contra un archivo SQLite en
 * la misma máquina eso es gratis; contra una base que vive en internet
 * —a donde va esto— es la mitad del presupuesto gastado en decir «sigo
 * aquí».
 *
 * ── Por qué la mitad y no otro número ──
 *
 * Sale de `AGENT_STALE_MS`, no es un número suelto. Escribiendo cada
 * mitad del plazo, lo guardado nunca puede tener más de media vida
 * cuando alguien lo mira, así que el agente jamás aparece caído estando
 * vivo. Y si mañana alguien cambia el plazo, esto lo acompaña solo.
 *
 * Un cambio de estado —se desenchufó la impresora— se escribe igual al
 * instante, sin esperar turno: eso es justo lo que hay que ver rápido.
 */
export const LATIDO_MS = AGENT_STALE_MS / 2;

/**
 * Cada cuánto se barren los trabajos vencidos.
 *
 * Se hacía en cada pregunta del agente, treinta veces por minuto, para
 * caducar cosas que llevan quince minutos esperando. Una vez por minuto
 * llega de sobra y el retraso máximo que añade es despreciable frente a
 * los quince minutos que se están midiendo.
 */
export const BARRIDO_MS = 60_000;

/**
 * Cuánto espera un trabajo antes de darse por vencido.
 *
 * Con una sola impresora que se muda, es normal que pase un rato sin
 * estar enchufada en ningún lado. Se aguanta ese rato, pero no un día:
 * si no, al conectarla saldrían de golpe todas las etiquetas viejas.
 */
export const STALE_JOB_MS = 15 * 60_000;

/** Estados en los que la impresora sirve para recibir trabajo. */
export function agentHasPrinter(status: string | null | undefined): boolean {
  return status === "ok" || status === "printing";
}

export type AgentView = {
  name: string;
  online: boolean;
  printerStatus: string;
  hasPrinter: boolean;
  lastSeenAt: string;
  lastSeenAgo: number;
};

/**
 * Foto del estado de todos los agentes, ya resuelto contra el reloj: un
 * agente apagado sigue teniendo guardado su último "impresora ok", y sin
 * este filtro parecería que la impresora está lista en una PC que ni
 * siquiera está encendida.
 */
export async function getAgentsView(): Promise<AgentView[]> {
  const now = Date.now();
  const agents = await prisma.printAgent.findMany({
    orderBy: { lastSeenAt: "desc" },
  });
  return agents.map((a) => {
    const lastSeenAgo = now - a.lastSeenAt.getTime();
    const online = lastSeenAgo < AGENT_STALE_MS;
    return {
      name: a.name,
      online,
      printerStatus: online ? a.printerStatus : "unknown",
      hasPrinter: online && agentHasPrinter(a.printerStatus),
      lastSeenAt: a.lastSeenAt.toISOString(),
      lastSeenAgo,
    };
  });
}
