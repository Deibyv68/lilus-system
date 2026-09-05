import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { datosDelRecibo, identidadDelVendedor, datosDeContacto } from "@/lib/tienda";
import { formatCurrency, formatDate } from "@/lib/format";
import { BotonImprimir } from "./boton-imprimir";

/**
 * El comprobante de compra de un pedido.
 *
 * ── Por qué NO es una factura, y por qué eso está escrito ──
 *
 * Emitir una factura o una nota de venta en Ecuador exige RUC y
 * autorización del SRI. LILUS no los tiene. Un papel que se parezca a una
 * factura sin serlo es peor que no tener papel: quien lo recibe cree que
 * puede usarlo para deducir un gasto, y no puede.
 *
 * Así que este documento se llama comprobante, no lleva ni un campo
 * fiscal —ni RUC, ni número de autorización, ni clave de acceso— y lo
 * dice al pie con todas las letras. El día que haya RUC, esta misma
 * página se convierte en factura añadiéndole lo que falta; hoy sería
 * mentir.
 *
 * ── Por qué una página y no un PDF adjunto ──
 *
 * Tres razones, por orden de importancia:
 *
 * 1. Se actualiza sola. Hoy dice «pendiente de pago» y mañana, cuando la
 *    dueña confirme la transferencia, dice «pagado» — con el mismo
 *    enlace. Un PDF mandado el lunes se queda con lo que era verdad el
 *    lunes.
 * 2. Los adjuntos se bloquean. Un enlace se abre siempre.
 * 3. Quien quiera el archivo lo tiene igual: cualquier navegador guarda
 *    como PDF al imprimir, y esta página está maquetada para salir bien
 *    en papel.
 */

export const metadata: Metadata = {
  title: "Comprobante",
  robots: { index: false, follow: false },
};

/* Igual que la página del pedido: el estado cambia y se viene a ver eso. */
export const dynamic = "force-dynamic";

export default async function PaginaRecibo({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [pedido, vendedor, contacto] = await Promise.all([
    datosDelRecibo(token),
    identidadDelVendedor(),
    datosDeContacto(),
  ]);

  if (!pedido) notFound();

  const pagado = pedido.comprobantes.reduce(
    (suma, c) => suma + (c.montoConfirmado ?? 0),
    0
  );
  /*
    En centavos para comparar. Sumar decimales en coma flotante da
    25,499999999999996 y un comprobante que dice «falta $0,00» es peor
    que uno que no dice nada. Es la misma cuenta que hace `pago-del-pedido`.
  */
  const faltan = Math.round(pedido.total * 100) - Math.round(pagado * 100);
  const estaPagado = faltan <= 0 && pedido.comprobantes.length > 0;
  const cancelado = pedido.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
      {/*
        La barra de vuelta e imprimir NO sale en papel: `print:hidden`.
        En una hoja impresa, un botón que dice «Imprimir» es ruido.
      */}
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <Link
          href={`/pedido/${token}`}
          className="inline-flex items-center gap-1.5 py-2 text-sm text-tienda-tenue transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Volver a mi pedido
        </Link>
        <BotonImprimir />
      </div>

      {/*
        La hoja. Fondo blanco y letra oscura SIEMPRE, también en la tienda
        oscura: un documento se lee en blanco y se imprime en blanco, y si
        heredara el tema oscuro saldría del papel como un rectángulo negro
        o, peor, en blanco sobre blanco.
      */}
      <article className="rounded-tienda-sm bg-white p-8 text-stone-900 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-stone-200 pb-6">
          <div>
            <p className="font-display text-2xl leading-none tracking-tight">
              LILUS
            </p>
            <p className="mt-1 text-xs text-stone-500">Jabones artesanales</p>
            <div className="mt-3 text-xs leading-relaxed text-stone-600">
              <p>{vendedor.nombre}</p>
              {vendedor.cedula && <p>Cédula {vendedor.cedula}</p>}
              {vendedor.ciudad && <p>{vendedor.ciudad}</p>}
              {vendedor.email && <p>{vendedor.email}</p>}
              {contacto.whatsappNumero && <p>WhatsApp {contacto.whatsappNumero}</p>}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xs font-medium uppercase tracking-[0.18em] text-stone-500">
              Comprobante de compra
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {pedido.orderNumber}
            </p>
            <p className="mt-1 text-xs text-stone-600">
              {formatDate(pedido.createdAt)}
            </p>

            {/*
              El sello de estado. Solo tres: pagado, pendiente, anulado.
              Los estados de logística —empaquetado, enviado— no pintan en
              un comprobante: dicen dónde está la caja, no si el dinero
              entró.
            */}
            <p
              className={`mt-3 inline-block rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wider ${
                cancelado
                  ? "bg-red-100 text-red-800"
                  : estaPagado
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
              }`}
            >
              {cancelado ? "Anulado" : estaPagado ? "Pagado" : "Pendiente de pago"}
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-stone-200 py-6 sm:grid-cols-2">
          <div>
            <p className="text-2xs font-medium uppercase tracking-[0.14em] text-stone-500">
              Comprador
            </p>
            <div className="mt-2 text-sm leading-relaxed">
              <p className="font-medium">{pedido.customer.name}</p>
              {pedido.customer.cedula && (
                <p className="text-stone-600">Cédula {pedido.customer.cedula}</p>
              )}
              {pedido.customer.phone && (
                <p className="text-stone-600">{pedido.customer.phone}</p>
              )}
              {pedido.customer.email && (
                <p className="break-all text-stone-600">{pedido.customer.email}</p>
              )}
            </div>
          </div>

          {pedido.shippingAddress && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-[0.14em] text-stone-500">
                Entrega
              </p>
              <div className="mt-2 text-sm leading-relaxed text-stone-700">
                <p>{pedido.shippingAddress.address}</p>
                <p>
                  {pedido.shippingAddress.city}, {pedido.shippingAddress.province}
                </p>
                {pedido.shippingAddress.reference && (
                  <p className="text-stone-500">
                    {pedido.shippingAddress.reference}
                  </p>
                )}
                {pedido.carrier && (
                  <p className="mt-1 text-stone-600">
                    {pedido.carrier.name}
                    {pedido.trackingNumber && ` · guía ${pedido.trackingNumber}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="py-6">
          {/*
            La tabla se desplaza sola si no cabe, pero en papel no hay
            desplazamiento posible: ahí se deja fluir a ancho completo.
          */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[420px] text-sm print:min-w-0">
              <thead>
                <tr className="border-b border-stone-200 text-2xs uppercase tracking-[0.12em] text-stone-500">
                  <th className="pb-2 text-left font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Cant.</th>
                  <th className="pb-2 text-right font-medium">Precio</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedido.items.map((i, n) => (
                  <tr key={n} className="border-b border-stone-100">
                    <td className="py-2.5 pr-3">{i.itemName}</td>
                    <td className="py-2.5 text-right tabular-nums">{i.quantity}</td>
                    <td className="py-2.5 text-right tabular-nums text-stone-600">
                      {formatCurrency(i.unitPrice)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      {formatCurrency(i.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-5 w-full max-w-xs space-y-1.5 text-sm">
            <Fila etiqueta="Productos" valor={formatCurrency(pedido.subtotal)} />
            <Fila etiqueta="Envío" valor={formatCurrency(pedido.shippingCost)} />
            <div className="flex items-baseline justify-between border-t border-stone-300 pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(pedido.total)}</span>
            </div>

            {/*
              Lo confirmado y lo que falta solo aparecen si hay algo que
              decir. En un pedido pagado entero, repetir el total tres
              veces no informa; en uno a medias, saber cuánto falta es todo
              lo que quien lo mira quiere saber.
            */}
            {pedido.comprobantes.length > 0 && (
              <div className="space-y-1.5 pt-2 text-stone-600">
                <Fila etiqueta="Pagado" valor={formatCurrency(pagado)} />
                {faltan > 0 && (
                  <div className="flex items-baseline justify-between font-medium text-amber-700">
                    <span>Falta</span>
                    <span className="tabular-nums">
                      {formatCurrency(faltan / 100)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/*
          La advertencia. Es lo más importante del documento después de las
          cifras, y por eso no va en letra diminuta escondida.
        */}
        <footer className="border-t border-stone-200 pt-5 text-xs leading-relaxed text-stone-500">
          <p>
            Este documento es un <strong className="font-medium">comprobante de compra</strong>{" "}
            y sirve como constancia de la transacción. <strong className="font-medium">No
            constituye una factura ni una nota de venta</strong>, y no tiene validez
            tributaria para deducir gastos.
          </p>
          <p className="mt-2">
            Emitido por LILUS · {formatDate(pedido.createdAt)} · Pedido{" "}
            {pedido.orderNumber}
          </p>
        </footer>
      </article>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-stone-600">{etiqueta}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  );
}
