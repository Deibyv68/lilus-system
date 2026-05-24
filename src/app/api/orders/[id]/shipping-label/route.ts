import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildShippingLabelPdf } from "@/lib/pdf-shipping-label";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      shippingAddress: true,
      carrier: true,
      items: true,
      productionUnits: true,
    },
  });
  if (!order) return new NextResponse("Pedido no encontrado", { status: 404 });

  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const weight = order.productionUnits.length * 80; // estimado fallback: 80g/unidad

  const pdfBytes = await buildShippingLabelPdf({
    orderNumber: order.orderNumber,
    carrier: order.carrier?.name ?? "—",
    sender: {
      name: map.sender_name ?? "LILUS",
      cedula: map.sender_cedula || undefined,
      phone: map.sender_phone || undefined,
      email: map.sender_email || undefined,
      city: map.sender_city || undefined,
      province: map.sender_province || undefined,
      address: map.sender_address ?? "Quito, Ecuador",
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
    weightGrams: weight,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${order.orderNumber}-envio.pdf"`,
    },
  });
}
