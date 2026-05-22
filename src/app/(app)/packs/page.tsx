import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map((p) => {
            const totalUnits = p.items.reduce((s, i) => s + i.quantity, 0);
            return (
              <Link
                key={p.id}
                href={`/packs/${p.id}`}
                className="group"
              >
                <Card className="overflow-hidden h-full transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/50">
                  {/* Imagen / placeholder */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/60 -mt-6 -mx-6 mb-0">
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
                    <Badge
                      variant={p.isActive ? "default" : "secondary"}
                      className="absolute top-3 right-3 shadow-sm"
                    >
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-[10px] font-mono text-muted-foreground shadow-sm">
                      {p.sku}
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                      <span className="text-lg font-bold tabular-nums shrink-0">
                        {formatCurrency(p.price)}
                      </span>
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    <div className="border-t pt-3">
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
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
