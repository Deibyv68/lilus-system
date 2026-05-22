import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../product-form";
import { DeleteProductButton } from "./delete-button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU: ${product.sku}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/productos">
                <ArrowLeft className="size-4" /> Volver
              </Link>
            </Button>
            <DeleteProductButton id={product.id} name={product.name} />
          </div>
        }
      />
      <ProductForm initial={product} />
    </>
  );
}
