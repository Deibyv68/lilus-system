import { prisma } from "./prisma";
import { buildShippingLabelPdf } from "./pdf-shipping-label";
import { buildExpiryLabelPdf } from "./pdf-expiry-label";
import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type PrintKind =
  | "shipping"
  | "product-labels"
  | "expiry-labels"
  | "box-logo";

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
        items: true,
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
        phone: m.sender_phone || undefined,
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
      itemsSummary: order.items
        .map((i) => `${i.quantity}× ${i.itemName}`)
        .join(" · "),
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
    // Modo "una a una": si viene unitIndex, filtramos a solo esa
    const selectedUnits =
      typeof options.unitIndex === "number"
        ? units.slice(options.unitIndex, options.unitIndex + 1)
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

    const MM_TO_PT = 2.83464567;
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

    for (let i = 0; i < totalCopies; i++) {
      const page = out.addPage([sizePt, sizePt]);
      page.drawPage(logoPage, { x: ox, y: oy, width: drawW, height: drawH });
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
