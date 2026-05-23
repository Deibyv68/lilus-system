import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Acepta ?ids=id1,id2,id3 y devuelve un resumen por pedido para el wizard
// de impresión por lote.
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      customer: { select: { name: true } },
      items: { select: { packId: true, quantity: true } },
      productionUnits: {
        select: { id: true, productName: true, batchCode: true },
        orderBy: { batchCode: "asc" },
      },
    },
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      productionUnits: o.productionUnits,
      packCount: o.items
        .filter((i) => i.packId)
        .reduce((s, i) => s + i.quantity, 0),
    })),
  });
}
