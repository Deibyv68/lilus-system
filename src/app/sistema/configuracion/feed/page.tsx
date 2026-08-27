import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { FeedAdmin } from "./feed-admin";

export const dynamic = "force-dynamic";

/**
 * Las fotos del feed de la portada.
 *
 * Están aquí y no mezcladas con las de producto porque cuentan otra cosa:
 * el taller y el proceso, no el catálogo.
 */
export default async function PaginaFeed() {
  const fotos = await prisma.feedImagen.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Link
        href="/sistema/configuracion"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Configuración
      </Link>

      <PageHeader
        title="Feed de la portada"
        description={
          fotos.length > 0
            ? `${fotos.length} foto${fotos.length === 1 ? "" : "s"} en la web`
            : "Todavía sin fotos: la sección no aparece en la portada"
        }
      />

      <FeedAdmin
        fotos={fotos.map((f) => ({
          id: f.id,
          url: f.url,
          alt: f.alt,
          enlace: f.enlace,
        }))}
      />

      {fotos.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Cómo se va a ver
          </h2>
          <div className="mt-3 flex gap-2 overflow-x-auto rounded-lg bg-neutral-900 p-3">
            {fotos.map((f) => (
              <div
                key={f.id}
                className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-md bg-neutral-800"
              >
                <Image
                  src={f.url}
                  alt=""
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
