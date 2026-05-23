import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Resumen ligero del pedido. Lo usa el wizard de creación para pasar al
// paso 5 (centro de impresión) sin tener que recargar la página.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNumber: true,
      items: { select: { packId: true, quantity: true } },
      productionUnits: {
        select: { id: true, productName: true, batchCode: true },
        orderBy: { batchCode: "asc" },
      },
    },
  });
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const packCount = order.items
    .filter((i) => i.packId)
    .reduce((s, i) => s + i.quantity, 0);

  return NextResponse.json({
    orderNumber: order.orderNumber,
    productionUnits: order.productionUnits,
    packCount,
  });
}
