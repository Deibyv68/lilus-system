import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { PlusCircle, ImageIcon, Boxes } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PacksPage() {
  const packs = await prisma.pack.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { name: true, shortName: true } } },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Packs"
        description="Paquetes que agrupan varios productos."
        actions={
          <Button asChild>
            <Link href="/packs/nuevo">
              <PlusCircle className="size-4" /> Nuevo pack
            </Link>
          </Button>
        }
      />

      {packs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <Boxes className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            Aún no tienes packs. Crea uno agrupando productos existentes.
          </p>
          <Button asChild>
            <Link href="/packs/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {packs.map((p) => {
            const totalUnits = p.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Link key={p.id} href={`/packs/${p.id}`} className="group">
                <div className="rounded-2xl border bg-card overflow-hidden h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50 active:scale-[0.99]">
                  {/* Imagen */}
                  <div className="relative aspect-[5/3] bg-gradient-to-br from-muted to-muted/60">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="size-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {!p.isActive && (
                      <Badge
                        variant="secondary"
                        className="absolute top-2 right-2 shadow-sm"
                      >
                        Inactivo
                      </Badge>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    {/* Header: SKU + estado */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {p.sku}
                      </span>
                      {p.isActive && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-green-700 dark:text-green-400">
                          <span className="size-1.5 rounded-full bg-green-600" />
                          Activo
                        </span>
                      )}
                    </div>

                    {/* Nombre */}
                    <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>

                    {/* Precio (full width, prominente) */}
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {formatCurrency(p.price)}
                    </p>

                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    {/* Contenido */}
                    <div className="border-t pt-3 mt-auto">
                      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                        <Boxes className="size-3" />
                        <span>Contenido · {totalUnits} unidades</span>
                      </div>
                      <ul className="space-y-1">
                        {p.items.map((i) => (
                          <li
                            key={i.id}
                            className="flex items-baseline gap-2 text-xs"
                          >
                            <span className="font-semibold text-foreground tabular-nums w-6 shrink-0">
                              {i.quantity}×
                            </span>
                            <span className="text-foreground/80 truncate">
                              {i.product.shortName ?? i.product.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
