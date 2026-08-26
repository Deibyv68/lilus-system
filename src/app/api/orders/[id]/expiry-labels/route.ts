import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExpiryLabelPdf, UNITS_PER_LABEL } from "@/lib/pdf-expiry-label";
import { pdfOrPngResponse } from "@/lib/pdf-response";
import { denyIfAnonymous } from "@/lib/guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // El PDF lleva nombre, teléfono y dirección del cliente impresos.
  // No sale sin sesión.
  const denegado = await denyIfAnonymous();
  if (denegado) return denegado;

  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format");
  const unitIndexParam = req.nextUrl.searchParams.get("unitIndex");
  const unitIndex = unitIndexParam !== null ? parseInt(unitIndexParam, 10) : null;

  const allUnits = await prisma.productionUnit.findMany({
    where: { orderId: id },
    orderBy: { batchCode: "asc" },
  });
  if (allUnits.length === 0) {
    return new NextResponse("Sin unidades para imprimir", { status: 404 });
  }

  // Cada etiqueta 2x1 lleva varios jabones, así que aquí unitIndex identifica
  // una etiqueta (un grupo), no una unidad suelta.
  const units =
    unitIndex !== null && !isNaN(unitIndex)
      ? allUnits.slice(
          unitIndex * UNITS_PER_LABEL,
          unitIndex * UNITS_PER_LABEL + UNITS_PER_LABEL
        )
      : allUnits;
  if (units.length === 0) {
    return new NextResponse("Índice fuera de rango", { status: 400 });
  }

  const pdfBytes = await buildExpiryLabelPdf(
    units.map((u) => ({
      productName: u.productName,
      sku: u.productSku,
      batchCode: u.batchCode,
      manufactureDate: u.manufactureDate,
      expiryDate: u.expiryDate,
    }))
  );

  return pdfOrPngResponse(pdfBytes, {
    format,
    filename: `${id}-caducidad.pdf`,
  });
}
