import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildShippingLabelPdf } from "@/lib/pdf-shipping-label";
import { pdfOrPngResponse } from "@/lib/pdf-response";
import { buildShippingItemsLines } from "@/lib/shipping-items-lines";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format");
  const order = await prisma.order.findUnique({
    where: { id },
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
    itemsLines: buildShippingItemsLines(order.items),
    itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
    weightGrams: weight,
  });

  return pdfOrPngResponse(pdfBytes, {
    format,
    filename: `${order.orderNumber}-envio.pdf`,
  });
}
