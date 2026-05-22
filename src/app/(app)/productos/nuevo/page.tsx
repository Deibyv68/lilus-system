import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ProductForm } from "../product-form";
import { ArrowLeft } from "lucide-react";

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        title="Nuevo producto"
        description="Registra un jabón o producto individual."
        actions={
          <Button variant="outline" asChild>
            <Link href="/productos">
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
        }
      />
      <ProductForm />
    </>
  );
}
