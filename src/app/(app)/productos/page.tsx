import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { PlusCircle, FileText } from "lucide-react";

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
        description="Jabones y productos individuales del catálogo."
        actions={
          <Button asChild>
            <Link href="/productos/nuevo">
              <PlusCircle className="size-4" /> Nuevo producto
            </Link>
          </Button>
        }
      />

      {products.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Aún no tienes productos registrados.
          </p>
          <Button asChild>
            <Link href="/productos/nuevo">Crear el primero</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Etiqueta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="rounded object-cover size-10"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/productos/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    {p._count.variants > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({p._count.variants} variantes)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.price)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatCurrency(p.productionCost)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.stock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {p.labelPdfUrl ? (
                      <a
                        href={p.labelPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="size-3" /> PDF
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
