import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json([]);

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { cedula: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ],
    },
    take: 8,
    orderBy: { updatedAt: "desc" },
    include: {
      addresses: {
        orderBy: [{ isDefault: "desc" }, { id: "desc" }],
        take: 1,
        include: { zone: true },
      },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(
    customers.map((c) => ({
      id: c.id,
      name: c.name,
      cedula: c.cedula,
      phone: c.phone,
      contactPhone: c.contactPhone,
      email: c.email,
      orderCount: c._count.orders,
      lastAddress: c.addresses[0]
        ? {
            province: c.addresses[0].province,
            city: c.addresses[0].city,
            address: c.addresses[0].address,
            reference: c.addresses[0].reference,
            zoneId: c.addresses[0].zoneId,
            zoneName: c.addresses[0].zone?.name,
          }
        : null,
    }))
  );
}
