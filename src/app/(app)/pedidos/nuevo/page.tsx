import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NewOrderForm } from "./new-order-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const [products, packs, zones, carriers, rates] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, price: true, imageUrl: true },
    }),
    prisma.pack.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, price: true, imageUrl: true },
    }),
    prisma.shippingZone.findMany({ orderBy: { name: "asc" } }),
    prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.shippingRate.findMany(),
  ]);

  return (
    <>
      <PageHeader
        title="Nuevo pedido"
        description="Registra una venta recibida por WhatsApp, Instagram o cualquier otro medio."
        actions={
          <Button variant="outline" asChild>
            <Link href="/pedidos">
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
        }
      />
      {products.length === 0 && packs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Necesitas productos o packs activos para crear un pedido.
          </p>
          <Button asChild>
            <Link href="/productos/nuevo">Crear producto</Link>
          </Button>
        </div>
      ) : (
        <NewOrderForm
          products={products}
          packs={packs}
          zones={zones}
          carriers={carriers}
          rates={rates.map((r) => ({
            zoneId: r.zoneId,
            carrierId: r.carrierId,
            price: r.price,
          }))}
        />
      )}
    </>
  );
}
