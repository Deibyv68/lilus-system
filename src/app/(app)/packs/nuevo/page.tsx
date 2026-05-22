import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PackForm } from "../pack-form";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewPackPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, sku: true, price: true },
  });

  return (
    <>
      <PageHeader
        title="Nuevo pack"
        description="Agrupa productos individuales en un solo paquete."
        actions={
          <Button variant="outline" asChild>
            <Link href="/packs">
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
        }
      />
      {products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Primero necesitas crear productos individuales antes de armar packs.
          </p>
          <Button asChild>
            <Link href="/productos/nuevo">Crear un producto</Link>
          </Button>
        </div>
      ) : (
        <PackForm productOptions={products} />
      )}
    </>
  );
}
