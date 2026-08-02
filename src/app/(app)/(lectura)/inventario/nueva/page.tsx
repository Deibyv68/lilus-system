import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import { MaterialForm } from "../material-form";

export const dynamic = "force-dynamic";

export default function NuevaMateriaPrimaPage() {
  return (
    <>
      <div className="mb-4">
        <Link
          href="/inventario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Inventario
        </Link>
      </div>

      <PageHeader
        title="Nueva materia prima"
        description="Los datos técnicos se pueden completar después."
      />

      <MaterialForm />
    </>
  );
}
