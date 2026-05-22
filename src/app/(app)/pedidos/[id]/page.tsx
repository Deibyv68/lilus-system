import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { PrintCenter } from "./print-center";
import { StatusSelector } from "./status-selector";
import { ShareButton } from "./share-button";
import { buildTrackingUrl } from "@/lib/share-message";
import { ArrowLeft, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      shippingAddress: true,
      carrier: true,
      zone: true,
      items: true,
      productionUnits: { include: { product: true } },
    },
  });
  if (!order) notFound();

  // Detectar productos sin PDF de etiqueta
  const missingLabels = Array.from(
    new Map(
      order.productionUnits
        .filter((u) => !u.product.labelPdfUrl)
        .map((u) => [u.product.id, u.product])
    ).values()
  );

  // ¿Cuántos packs vende este pedido? (para el logo de caja)
  const packCount = order.items
    .filter((i) => i.packId)
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <PageHeader
        title={`Pedido ${order.orderNumber}`}
        description={`${order.customer.name} · ${formatDateTime(order.createdAt)}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/pedidos">
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Productos
                <Badge variant="outline">{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ítem</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">P. Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>
                        <p className="font-medium">{it.itemName}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {it.itemSku}
                          {it.packId && " · Pack"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(it.lineTotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="border-t mt-4 pt-4 space-y-1.5 text-sm max-w-xs ml-auto">
                <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
                <Row
                  label={`Envío (${order.carrier?.name ?? "—"})`}
                  value={formatCurrency(order.shippingCost)}
                />
                <Row label="Total" value={formatCurrency(order.total)} strong />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unidades a producir (etiqueta 2x1)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {order.productionUnits.length} unidades físicas. Cada una tendrá
                su lote y fecha de caducidad.
              </p>
              <ul className="text-xs space-y-1 max-h-48 overflow-y-auto">
                {order.productionUnits.map((u) => (
                  <li key={u.id} className="flex justify-between gap-2 font-mono">
                    <span className="truncate">{u.productName}</span>
                    <span className="text-muted-foreground">{u.batchCode}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusSelector
                id={order.id}
                status={order.status}
                carrierName={order.carrier?.name ?? null}
                existingTracking={order.trackingNumber}
              />

              {order.trackingNumber && (
                <div className="rounded-md border bg-muted/40 p-2.5 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="size-3.5" />
                    <span className="font-medium">Guía de envío</span>
                  </div>
                  <p className="font-mono break-all">{order.trackingNumber}</p>
                  {(() => {
                    const url = buildTrackingUrl(
                      order.carrier?.trackingUrlTemplate ?? null,
                      order.trackingNumber
                    );
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-block"
                      >
                        Rastrear en {order.carrier?.name}
                      </a>
                    ) : null;
                  })()}
                </div>
              )}

              {order.status === "SHIPPED" || order.status === "DELIVERED" ? (
                <ShareButton
                  order={{
                    orderNumber: order.orderNumber,
                    customerName: order.customer.name,
                    items: order.items.map((it) => ({
                      quantity: it.quantity,
                      itemName: it.itemName,
                    })),
                    total: order.total,
                    shippingCost: order.shippingCost,
                    carrierName: order.carrier?.name ?? null,
                    trackingNumber: order.trackingNumber,
                    trackingUrl: null,
                    address: order.shippingAddress
                      ? {
                          address: order.shippingAddress.address,
                          city: order.shippingAddress.city,
                          province: order.shippingAddress.province,
                          reference: order.shippingAddress.reference,
                        }
                      : null,
                  }}
                  customerPhone={order.customer.phone}
                  carrierTrackingTemplate={
                    order.carrier?.trackingUrlTemplate ?? null
                  }
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente y envío</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{order.customer.name}</p>
              {order.customer.cedula && (
                <p className="text-muted-foreground">CI/RUC: {order.customer.cedula}</p>
              )}
              {order.customer.phone && (
                <p className="text-muted-foreground">Tel: {order.customer.phone}</p>
              )}
              {order.customer.email && (
                <p className="text-muted-foreground">{order.customer.email}</p>
              )}
              <div className="border-t pt-2 mt-2">
                <p>{order.shippingAddress?.address}</p>
                <p className="text-muted-foreground">
                  {order.shippingAddress?.city}, {order.shippingAddress?.province}
                </p>
                {order.shippingAddress?.reference && (
                  <p className="text-xs italic mt-1">
                    Ref: {order.shippingAddress.reference}
                  </p>
                )}
                <Badge variant="outline" className="mt-2">
                  {order.zone?.name ?? "Sin zona"}
                </Badge>
              </div>
              {order.notes && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-xs">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <PrintCenter
            orderId={order.id}
            missingLabels={missingLabels}
            packCount={packCount}
          />
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex justify-between ${
        strong ? "font-bold text-base pt-2 border-t" : ""
      }`}
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
