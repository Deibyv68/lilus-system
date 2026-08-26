import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft } from "lucide-react";
import { MaterialForm } from "../../material-form";
import { DeleteMaterialButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function EditarMateriaPrimaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const material = await prisma.material.findUnique({
    where: { slug },
    include: { _count: { select: { lots: true } } },
  });
  if (!material) notFound();

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/sistema/inventario/${material.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {material.name}
        </Link>
      </div>

      <PageHeader
        title="Editar materia prima"
        actions={
          <DeleteMaterialButton
            id={material.id}
            name={material.name}
            lotCount={material._count.lots}
          />
        }
      />

      <MaterialForm initial={material} />
    </>
  );
}
