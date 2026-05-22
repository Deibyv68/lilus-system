import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildExpiryLabelPdf } from "@/lib/pdf-expiry-label";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const units = await prisma.productionUnit.findMany({
    where: { orderId: id },
    orderBy: { batchCode: "asc" },
  });
  if (units.length === 0) {
    return new NextResponse("Sin unidades para imprimir", { status: 404 });
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

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${id}-caducidad.pdf"`,
    },
  });
}
