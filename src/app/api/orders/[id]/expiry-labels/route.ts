import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExpiryLabelPdf } from "@/lib/pdf-expiry-label";
import { pdfOrPngResponse } from "@/lib/pdf-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const units =
    unitIndex !== null && !isNaN(unitIndex)
      ? allUnits.slice(unitIndex, unitIndex + 1)
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
