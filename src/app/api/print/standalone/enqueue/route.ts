import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MM_TO_PT = 2.83464567;

// Encola un trabajo de impresión "standalone" (sin pedido asociado).
// Usado por la sección de etiquetas sueltas.
// Body: { kind: "product-labels" | "box-logo", productId?, copies, offsetX?, offsetY? }
export async function POST(req: NextRequest) {
  let body: {
    kind?: "product-labels" | "box-logo";
    productId?: string;
    copies?: number;
    offsetX?: number;
    offsetY?: number;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!body.kind) {
    return NextResponse.json({ error: "kind requerido" }, { status: 400 });
  }

  // Verificar agente activo + impresora configurada
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["print_agent_enabled", "print_agent_printer"] },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  if (map.print_agent_enabled !== "true") {
    return NextResponse.json(
      { error: "El agente de impresión no está habilitado" },
      { status: 400 }
    );
  }
  const printerName = map.print_agent_printer;
  if (!printerName) {
    return NextResponse.json(
      { error: "Falta configurar el nombre de la impresora" },
      { status: 400 }
    );
  }

  const copies = Math.max(1, Math.min(50, body.copies ?? 1));

  let pdfBuffer: Buffer;

  if (body.kind === "product-labels") {
    if (!body.productId) {
      return NextResponse.json(
        { error: "productId requerido para product-labels" },
        { status: 400 }
      );
    }
    const product = await prisma.product.findUnique({
      where: { id: body.productId },
      select: { labelPdfUrl: true },
    });
    if (!product?.labelPdfUrl) {
      return NextResponse.json(
        { error: "El producto no tiene PDF de etiqueta" },
        { status: 404 }
      );
    }
    const filepath = path.join(process.cwd(), "public", product.labelPdfUrl);
    const srcBytes = await readFile(filepath);
    const src = await PDFDocument.load(srcBytes);
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, src.getPageIndices());
    const xPt = (body.offsetX ?? 0) * MM_TO_PT;
    const yPt = (body.offsetY ?? 0) * MM_TO_PT;
    for (let i = 0; i < copies; i++) {
      for (const p of pages) {
        const added = out.addPage(p);
        if (xPt !== 0 || yPt !== 0) added.translateContent(xPt, yPt);
      }
    }
    pdfBuffer = Buffer.from(await out.save());
  } else if (body.kind === "box-logo") {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "brand",
      "lilus-logo.pdf"
    );
    const logoBytes = await readFile(logoPath);
    const logoDoc = await PDFDocument.load(logoBytes);
    const out = await PDFDocument.create();
    const [logoPage] = await out.embedPdf(logoDoc, [0]);
    const sizePt = 2 * 72;
    const scale = (sizePt * 0.9) / Math.max(logoPage.width, logoPage.height);
    const drawW = logoPage.width * scale;
    const drawH = logoPage.height * scale;
    const ox = (sizePt - drawW) / 2;
    const oy = (sizePt - drawH) / 2;
    for (let i = 0; i < copies; i++) {
      const page = out.addPage([sizePt, sizePt]);
      page.drawPage(logoPage, { x: ox, y: oy, width: drawW, height: drawH });
    }
    pdfBuffer = Buffer.from(await out.save());
  } else {
    return NextResponse.json(
      { error: "kind no soportado" },
      { status: 400 }
    );
  }

  // El agente trata "product-labels" y "box-logo" igual: usa el papel 2"×2"
  // configurado en PRINT_OPTIONS_BY_KIND. orderId queda null porque no hay
  // pedido asociado.
  const job = await prisma.printJob.create({
    data: {
      orderId: null,
      kind: body.kind,
      printerName,
      copies: 1, // copies ya están en el PDF
      pdfBase64: pdfBuffer.toString("base64"),
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}
