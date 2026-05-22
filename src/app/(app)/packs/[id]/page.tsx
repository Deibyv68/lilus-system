import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PackForm } from "../pack-form";
import { DeletePackButton } from "./delete-button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pack, products] = await Promise.all([
    prisma.pack.findUnique({
      where: { id },
      include: { items: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, price: true },
    }),
  ]);
  if (!pack) notFound();

  return (
    <>
      <PageHeader
        title={pack.name}
        description={`SKU: ${pack.sku}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/packs">
                <ArrowLeft className="size-4" /> Volver
              </Link>
            </Button>
            <DeletePackButton id={pack.id} name={pack.name} />
          </div>
        }
      />
      <PackForm
        productOptions={products}
        initial={{
          ...pack,
          items: pack.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }}
      />
    </>
  );
}
