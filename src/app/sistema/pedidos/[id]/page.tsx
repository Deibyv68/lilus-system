import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { StatusSelector } from "./status-selector";
import { AvisoDePago } from "../espera";
import { ShareButton } from "./share-button";
import { Pago } from "./pago";
import { MapaMini } from "./mapa-mini";
import { estadoDePago } from "@/lib/pago-del-pedido";
import { buildTrackingUrl } from "@/lib/share-message";
import {
  ArrowLeft,
  Truck,
  Printer,
  MapPin,
  ExternalLink,
} from "lucide-react";

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
      /*
        Cada línea con su foto, y los packs con lo que llevan dentro.

        La receta se busca por el producto: `Recipe.productId` es el
        vínculo, y sirve para saltar de «esto se vendió» a «así se hace»
        sin pasar por el buscador del recetario.
      */
      items: {
        include: {
          product: {
            select: {
              id: true,
              imageUrl: true,
              recipes: {
                where: { isActive: true },
                select: { slug: true },
                take: 1,
              },
            },
          },
          pack: {
            select: {
              imageUrl: true,
              items: {
                select: {
                  quantity: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                      recipes: {
                        where: { isActive: true },
                        select: { slug: true },
                        take: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      productionUnits: { include: { product: true } },
      comprobantes: { orderBy: { createdAt: "desc" } },
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

  // ¿Está activo el agente de impresión?
  const agentEnabledSetting = await prisma.setting.findUnique({
    where: { key: "print_agent_enabled" },
  });
  const agentEnabled = agentEnabledSetting?.value === "true";

  /*
    Los datos del pedido para los mensajes, armados una vez.

    El selector de estado y el botón de compartir mandan el MISMO mensaje,
    así que comparten la misma fuente. Con dos objetos escritos aparte, el
    día que se añada un dato al mensaje solo lo tendría uno de los dos y
    nadie se enteraría hasta que un cliente recibiera media información.
  */
  const enlaceBase = (process.env.APP_URL ?? "").trim().replace(/\/+$/, "");

  /*
    El mismo número de comprobante usado en otro pedido.

    Es la estafa más común y la más fácil de pillar: se manda la misma
    captura de una transferencia real a dos pedidos distintos.

    Se buscan tanto los números que leyó la máquina como los que confirmó
    una persona, en las dos direcciones. Buscar solo por los leídos dejaba
    un hueco: el comprobante repetido que alguien ya revisó y corrigió a
    mano dejaba de aparecer justo cuando el número era MÁS fiable.
  */
  const numeros = Array.from(
    new Set(
      order.comprobantes
        .flatMap((c) => [c.numeroLeido, c.numeroConfirmado])
        .filter((n): n is string => Boolean(n))
    )
  );

  const repetidos = (
    numeros.length > 0
      ? await prisma.comprobanteDePago.findMany({
          where: {
            orderId: { not: order.id },
            OR: [
              { numeroLeido: { in: numeros } },
              { numeroConfirmado: { in: numeros } },
            ],
          },
          select: {
            numeroLeido: true,
            numeroConfirmado: true,
            order: { select: { id: true, orderNumber: true } },
          },
        })
      : []
  ).flatMap((r) =>
    /*
      Un comprobante puede coincidir por su número leído o por el
      confirmado, y no tienen por qué ser el mismo: si el OCR se equivocó
      allá y alguien lo corrigió, son dos cadenas distintas y solo una
      cuadra con la de aquí. Se emiten las dos y el componente filtra.
    */
    [r.numeroConfirmado, r.numeroLeido]
      .filter((n): n is string => Boolean(n) && numeros.includes(n!))
      .map((numero) => ({
        numero,
        orderId: r.order.id,
        orderNumber: r.order.orderNumber,
      }))
  );

  /*
    El estado del cobro, calculado una vez.

    Lo usan el selector de estado —para preguntar antes de dar por pagado
    algo que los comprobantes no cubren— y la tarjeta de Pago. Con dos
    cálculos aparte, el día que cambie la regla uno de los dos seguiría
    con la vieja y nadie se enteraría.
  */
  const cobro = estadoDePago(order.comprobantes, order.total);

  const paraMensaje = {
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
    /*
      El enlace solo si hay dirección pública configurada.

      Sin `APP_URL` saldría «/pedido/abc…», una ruta relativa — que en un
      mensaje de WhatsApp no es un enlace, es texto que no lleva a ningún
      lado. Mejor un mensaje sin enlace que uno con un enlace roto: el
      segundo hace que quien lo recibe piense que el sistema está mal
      hecho, y encima escribe para preguntar.
    */
    enlacePedido: enlaceBase && order.publicToken
      ? `${enlaceBase}/pedido/${order.publicToken}`
      : null,
    address: order.shippingAddress
      ? {
          address: order.shippingAddress.address,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          reference: order.shippingAddress.reference,
        }
      : null,
  };

  return (
    <>
      <div className="mb-4">
        <Link
          href="/sistema/pedidos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Pedidos
        </Link>
      </div>
      <PageHeader
        title={`Pedido ${order.orderNumber}`}
        description={`${order.customer.name} · ${formatDateTime(order.createdAt)}`}
      />

      {/*
        El mismo aviso que en la lista. Se repite a propósito: es la
        pantalla donde se cambia el estado, o sea donde se actúa sobre él.
      */}
      <div className="-mt-2 mb-6">
        <AvisoDePago estado={order.status} creadoEn={order.createdAt} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Productos</span>
                <Badge variant="outline">{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y -mx-2">
                {order.items.map((it) => (
                  <li key={it.id} className="px-2 py-3">
                    <div className="flex items-start gap-3">
                      <Miniatura
                        url={it.product?.imageUrl ?? it.pack?.imageUrl ?? null}
                        nombre={it.itemName}
                        receta={it.product?.recipes[0]?.slug ?? null}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-tight">
                          {/*
                            El nombre lleva a la receta cuando la hay.

                            Quien mira este desglose para preparar el pedido
                            necesita a cada rato cómo se hace lo que va a
                            preparar, y hasta ahora tenía que ir al recetario
                            y buscarlo por nombre — con el pedido abierto en
                            otra pestaña para no perder la cuenta.
                          */}
                          {it.product?.recipes[0] ? (
                            <Link
                              href={`/sistema/recetario/${it.product.recipes[0].slug}`}
                              className="hover:underline"
                            >
                              {it.itemName}
                            </Link>
                          ) : (
                            it.itemName
                          )}
                        </p>
                        <p className="text-2xs text-muted-foreground font-mono mt-0.5">
                          {it.itemSku}
                          {it.packId && " · Pack"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {it.quantity} × {formatCurrency(it.unitPrice)}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums shrink-0">
                        {formatCurrency(it.lineTotal)}
                      </span>
                    </div>

                    {/*
                      Lo que lleva el pack, desplegado.

                      «Pack Ritual de Luminosidad» no dice qué hay que
                      preparar. Quien arma el pedido tiene que saberlo, y
                      abrir el catálogo a mirarlo es un viaje de ida y
                      vuelta por cada pack de cada pedido.
                    */}
                    {it.pack && it.pack.items.length > 0 && (
                      <ul className="mt-3 ml-2 space-y-2 border-l pl-4">
                        {it.pack.items.map((pieza) => (
                          <li
                            key={pieza.product.id}
                            className="flex items-center gap-2.5"
                          >
                            <Miniatura
                              url={pieza.product.imageUrl}
                              nombre={pieza.product.name}
                              receta={pieza.product.recipes[0]?.slug ?? null}
                              pequena
                            />
                            <span className="min-w-0 flex-1 text-xs">
                              {pieza.product.recipes[0] ? (
                                <Link
                                  href={`/sistema/recetario/${pieza.product.recipes[0].slug}`}
                                  className="hover:underline"
                                >
                                  {pieza.product.name}
                                </Link>
                              ) : (
                                pieza.product.name
                              )}
                            </span>
                            {pieza.quantity > 1 && (
                              <span className="shrink-0 text-2xs text-muted-foreground tabular-nums">
                                ×{pieza.quantity}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>

              <div className="border-t mt-3 pt-3 space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
                <Row
                  label={`Envío${order.carrier ? ` · ${order.carrier.name}` : ""}`}
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
                pedido={paraMensaje}
                telefono={order.customer.phone}
                telefonoContacto={order.customer.contactPhone}
                plantillaGuia={order.carrier?.trackingUrlTemplate ?? null}
                cobro={{
                  total: order.total,
                  confirmado: cobro.confirmado,
                  falta: cobro.falta,
                  porRevisar: cobro.porRevisar,
                  hayComprobantes: cobro.hayComprobantes,
                }}
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

              <ShareButton
                order={paraMensaje}
                status={order.status as never}
                customerPhone={order.customer.phone}
                customerContactPhone={order.customer.contactPhone}
                carrierTrackingTemplate={
                  order.carrier?.trackingUrlTemplate ?? null
                }
              />

              {/*
                La página que ve el cliente, a un toque.

                El enlace viaja dentro de los mensajes, pero hasta ahora no
                había forma de abrirlo desde aquí: ni para comprobar qué
                está viendo quien pregunta, ni para pegarlo en una
                conversación que ya estaba abierta.

                Va relativo —«/pedido/…»— y no con la dirección pública, así
                que funciona aunque `APP_URL` no esté puesta. Para ella, que
                está dentro del panel, es lo único que hace falta.
              */}
              {order.publicToken && (
                <a
                  href={`/pedido/${order.publicToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Ver la página del cliente
                </a>
              )}

              {/*
                Que se note cuando el mensaje sale sin enlace.

                El enlace se omite si no hay dirección pública, y hasta
                ahora eso pasaba en silencio: los mensajes salían más
                pobres —sin el sitio donde pagar, ver el estado y subir el
                comprobante— y nadie tenía forma de saber por qué. Un
                trabajo que no se hace y no avisa es peor que uno que
                falla.
              */}
              {!enlaceBase && (
                <p className="rounded-md border border-dashed px-2.5 py-2 text-2xs text-muted-foreground">
                  Los mensajes salen <strong>sin el enlace</strong> al pedido,
                  así que el cliente tiene que entrar a «Mi pedido» y teclear
                  su número y su correo. Se arregla poniendo la dirección
                  pública de la tienda (<code>APP_URL</code>) en la laptop.
                </p>
              )}
            </CardContent>
          </Card>

          {/*
            El pago va entre el estado y el cliente, no al final.

            Es el gesto completo: mirar la foto del banco, escribir lo que
            dice, y marcar «Pagado» — que está justo encima. Separarlos
            obligaría a bajar, mirar, subir y acordarse, que es donde se
            cuela el error de confirmar el pedido equivocado.
          */}
          <Pago
            orderId={order.id}
            total={order.total}
            estadoPedido={order.status}
            comprobantes={order.comprobantes}
            repetidos={repetidos}
            pedido={paraMensaje}
            telefono={order.customer.phone}
            telefonoContacto={order.customer.contactPhone}
          />

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
                  {/*
                    El postal, cuando el mapa lo supo. Va pegado a la
                    ciudad porque es lo que mira quien despacha en el
                    mostrador de la transportadora.
                  */}
                  {order.shippingAddress?.postal && (
                    <span className="ml-1.5 font-mono text-xs">
                      · {order.shippingAddress.postal}
                    </span>
                  )}
                </p>
                {order.shippingAddress?.reference && (
                  <p className="text-xs italic mt-1">
                    Ref: {order.shippingAddress.reference}
                  </p>
                )}
                {/*
                  El punto que marcó quien compró, si lo marcó.

                  Vale más que la calle: media dirección en Ecuador es
                  «sendero del quinde y de los quindes», y eso no lo
                  encuentra nadie. El enlace abre Google Maps porque es lo
                  que tiene instalado quien reparte — el punto es el mismo
                  venga de donde venga.
                */}
                {order.shippingAddress?.lat != null &&
                  order.shippingAddress?.lng != null && (
                    <MapaMini
                      lat={order.shippingAddress.lat}
                      lng={order.shippingAddress.lng}
                      etiqueta={order.shippingAddress.address}
                    />
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

          {/* CTA grande para abrir el wizard de impresión */}
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Printer className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">
                    Imprimir etiquetas
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Envío, productos, caducidad
                    {packCount > 0 ? " y logo de caja" : ""} — paso a paso con
                    previsualización.
                  </p>
                </div>
              </div>

              {missingLabels.length > 0 && (
                <div className="text-2xs rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 text-amber-800 dark:text-amber-300 p-2">
                  <p className="font-medium">
                    ⚠ {missingLabels.length} producto
                    {missingLabels.length === 1 ? "" : "s"} sin PDF de etiqueta
                  </p>
                  <ul className="list-disc pl-4 mt-1">
                    {missingLabels.slice(0, 3).map((m) => (
                      <li key={m.id} className="font-mono">
                        {m.sku}
                      </li>
                    ))}
                    {missingLabels.length > 3 && (
                      <li className="italic">… y más</li>
                    )}
                  </ul>
                </div>
              )}

              <Button asChild className="w-full h-12">
                <Link href={`/sistema/pedidos/${order.id}/imprimir`}>
                  <Printer className="size-4" />
                  Ir a imprimir
                </Link>
              </Button>
            </CardContent>
          </Card>
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

/**
 * La foto de un producto en el desglose, y el atajo a su receta.
 *
 * Es la miniatura interna de trabajo —la misma que se ve en el catálogo
 * del panel— y no la foto de tienda: aquí no se vende nada, se reconoce.
 * Para eso una foto mal iluminada sirve igual que una buena.
 *
 * Cuando no hay foto queda el hueco con la inicial. Un cuadro vacío
 * desalinea la fila y hace que la lista se lea peor que sin fotos.
 */
function Miniatura({
  url,
  nombre,
  receta,
  pequena = false,
}: {
  url: string | null;
  nombre: string;
  receta: string | null;
  pequena?: boolean;
}) {
  const lado = pequena ? "size-8" : "size-12";

  const cuadro = url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={`${lado} shrink-0 rounded-md border object-cover`}
    />
  ) : (
    <span
      className={`${lado} flex shrink-0 items-center justify-center rounded-md border bg-muted text-xs font-medium text-muted-foreground`}
      aria-hidden="true"
    >
      {nombre.trim().charAt(0).toUpperCase()}
    </span>
  );

  if (!receta) return cuadro;

  return (
    <Link
      href={`/sistema/recetario/${receta}`}
      className="shrink-0 transition-opacity hover:opacity-75"
      aria-label={`Ver la receta de ${nombre}`}
    >
      {cuadro}
    </Link>
  );
}
