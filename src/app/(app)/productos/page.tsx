import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { PlusCircle, ImageIcon, Package, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { variants: true } } },
  });

  return (
    <>
      <PageHeader
        title="Productos"
        description={
          products.length > 0
            ? `${products.length} productos en el catálogo`
            : "Catálogo vacío"
        }
        actions={
          <Button asChild size="lg" className="h-11">
            <Link href="/productos/nuevo">
              <PlusCircle className="size-4" /> Nuevo
            </Link>
          </Button>
        }
      />

      {products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <Package className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            Aún no tienes productos registrados.
          </p>
          <Button asChild size="lg">
            <Link href="/productos/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/productos/${p.id}`} className="group">
              <div className="rounded-2xl border bg-card overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/50 active:scale-[0.98]">
                {/* Imagen */}
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/60">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-10 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Badges flotantes */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {!p.isActive && (
                      <Badge variant="secondary" className="text-[10px]">
                        Inactivo
                      </Badge>
                    )}
                    {p.labelPdfUrl && (
                      <div
                        className="size-7 rounded-md bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm"
                        title="Tiene etiqueta PDF cargada"
                      >
                        <FileText className="size-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col gap-1.5">
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {p.sku}
                  </p>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5em]">
                    {p.name}
                  </h3>
                  <div className="flex items-end justify-between gap-2 mt-auto pt-1">
                    <span className="text-lg font-bold tabular-nums leading-none">
                      {formatCurrency(p.price)}
                    </span>
                    {p.stock > 0 ? (
                      <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                        Stock {p.stock}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium whitespace-nowrap">
                        Sin stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
