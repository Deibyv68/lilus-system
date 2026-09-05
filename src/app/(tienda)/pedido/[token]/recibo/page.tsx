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
 * ── Dos presentaciones del mismo documento ──
 *
 * En pantalla va oscuro, como el resto de la tienda: quien llega aquí
 * viene de su página de pedido y una hoja blanca en medio se lee como un
 * error de la web, no como un documento.
 *
 * En papel va blanco. Eso NO se hace aquí sino en `globals.css`, bajo
 * `.hoja-recibo`: son quince líneas de reglas de impresión en un solo
 * sitio, y la alternativa —un `print:` colgando de cada color de este
 * archivo— haría ilegible el marcado para ahorrarse un bloque de CSS.
 *
 * ── Por qué una página y no un PDF adjunto ──
 *
 * Se actualiza sola: hoy dice «pendiente de pago» y mañana, cuando la
 * dueña confirme la transferencia, dice «pagado» — con el mismo enlace.
 * Un PDF mandado el lunes se queda con lo que era verdad el lunes. Y
 * quien quiera el archivo lo tiene igual: el navegador guarda como PDF al
 * imprimir.
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
    <div className="pagina-recibo mx-auto max-w-3xl px-5 py-10">
      {/*
        La barra de vuelta e imprimir no sale en papel: en una hoja
        impresa, un botón que dice «Imprimir» es ruido.
      */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href={`/pedido/${token}`}
          className="inline-flex items-center gap-1.5 py-2 text-sm text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Volver a mi pedido
        </Link>
        <BotonImprimir />
      </div>

      <article className="hoja-recibo rounded-tienda-sm border border-tienda-linea bg-tienda-fondo-alt p-8 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-8 border-b border-tienda-linea pb-7">
          <div>
            <p className="font-display text-3xl leading-none tracking-[0.02em] text-white">
              LILUS
            </p>
            <p className="mt-1.5 text-xs text-tienda-tenue">
              Jabones artesanales
            </p>
            <div className="mt-4 space-y-0.5 text-xs leading-relaxed text-tienda-tenue">
              <p>{vendedor.nombre}</p>
              {vendedor.cedula && <p>Cédula {vendedor.cedula}</p>}
              {vendedor.ciudad && <p>{vendedor.ciudad}</p>}
              {vendedor.email && <p>{vendedor.email}</p>}
              {contacto.whatsappNumero && <p>WhatsApp {contacto.whatsappNumero}</p>}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xs uppercase tracking-[0.18em] text-tienda-tenue">
              Comprobante de compra
            </p>
            <p className="mt-2 font-display text-2xl leading-none tracking-[0.01em] text-white">
              {pedido.orderNumber}
            </p>
            <p className="mt-2 text-xs text-tienda-tenue">
              {formatDate(pedido.createdAt)}
            </p>

            {/*
              El sello de estado. Solo tres: pagado, pendiente, anulado.
              Los estados de logística —empaquetado, enviado— no pintan en
              un comprobante: dicen dónde está la caja, no si el dinero
              entró.
            */}
            <p
              className={`sello mt-4 inline-block rounded-full border px-3.5 py-1.5 text-2xs uppercase tracking-[0.12em] ${
                cancelado
                  ? "sello-malo border-red-400/30 bg-red-400/10 text-red-300"
                  : estaPagado
                    ? "sello-bueno border-tienda-acento/40 bg-tienda-acento/10 text-tienda-acento"
                    : "sello-espera border-amber-300/25 bg-amber-300/10 text-amber-200"
              }`}
            >
              {cancelado ? "Anulado" : estaPagado ? "Pagado" : "Pendiente de pago"}
            </p>
          </div>
        </header>

        <section className="grid gap-8 border-b border-tienda-linea py-7 sm:grid-cols-2">
          <div>
            <p className="text-2xs uppercase tracking-[0.14em] text-tienda-tenue">
              Comprador
            </p>
            <div className="mt-3 space-y-0.5 text-sm leading-relaxed text-tienda-texto">
              <p className="text-white">{pedido.customer.name}</p>
              {pedido.customer.cedula && <p>Cédula {pedido.customer.cedula}</p>}
              {pedido.customer.phone && <p>{pedido.customer.phone}</p>}
              {pedido.customer.email && (
                <p className="break-all">{pedido.customer.email}</p>
              )}
            </div>
          </div>

          {pedido.shippingAddress && (
            <div>
              <p className="text-2xs uppercase tracking-[0.14em] text-tienda-tenue">
                Entrega
              </p>
              <div className="mt-3 space-y-0.5 text-sm leading-relaxed text-tienda-texto">
                <p>{pedido.shippingAddress.address}</p>
                <p>
                  {pedido.shippingAddress.city}, {pedido.shippingAddress.province}
                </p>
                {pedido.shippingAddress.reference && (
                  <p className="text-tienda-tenue">
                    {pedido.shippingAddress.reference}
                  </p>
                )}
                {pedido.carrier && (
                  <p className="pt-1 text-tienda-tenue">
                    {pedido.carrier.name}
                    {pedido.trackingNumber && ` · guía ${pedido.trackingNumber}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="py-7">
          {/*
            La tabla se desplaza sola si no cabe, pero en papel no hay
            desplazamiento posible: ahí se deja fluir a ancho completo.
          */}
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[420px] text-sm print:min-w-0">
              <thead>
                <tr className="border-b border-tienda-linea text-2xs uppercase tracking-[0.12em] text-tienda-tenue">
                  <th className="pb-3 text-left font-normal">Producto</th>
                  <th className="pb-3 text-right font-normal">Cant.</th>
                  <th className="pb-3 text-right font-normal">Precio</th>
                  <th className="pb-3 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedido.items.map((i, n) => (
                  <tr key={n} className="border-b border-tienda-linea/60">
                    <td className="py-3 pr-3 text-tienda-texto">{i.itemName}</td>
                    <td className="py-3 text-right tabular-nums text-tienda-texto">
                      {i.quantity}
                    </td>
                    <td className="py-3 text-right tabular-nums text-tienda-tenue">
                      {formatCurrency(i.unitPrice)}
                    </td>
                    <td className="py-3 text-right tabular-nums text-tienda-texto">
                      {formatCurrency(i.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
            <Fila etiqueta="Productos" valor={formatCurrency(pedido.subtotal)} />
            <Fila etiqueta="Envío" valor={formatCurrency(pedido.shippingCost)} />
            <div className="flex items-baseline justify-between border-t border-tienda-linea pt-3">
              <span className="text-tienda-texto">Total</span>
              <span className="font-display text-xl tabular-nums text-white">
                {formatCurrency(pedido.total)}
              </span>
            </div>

            {/*
              Lo confirmado y lo que falta solo aparecen si hay algo que
              decir. En un pedido pagado entero, repetir el total tres
              veces no informa; en uno a medias, saber cuánto falta es todo
              lo que quien lo mira quiere saber.
            */}
            {pedido.comprobantes.length > 0 && (
              <div className="space-y-2 pt-1">
                <Fila etiqueta="Pagado" valor={formatCurrency(pagado)} />
                {faltan > 0 && (
                  <div className="falta flex items-baseline justify-between text-amber-200">
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
        <footer className="border-t border-tienda-linea pt-6 text-xs leading-relaxed text-tienda-tenue">
          <p>
            Este documento es un{" "}
            <strong className="font-medium text-tienda-texto">
              comprobante de compra
            </strong>{" "}
            y sirve como constancia de la transacción.{" "}
            <strong className="font-medium text-tienda-texto">
              No constituye una factura ni una nota de venta
            </strong>
            , y no tiene validez tributaria para deducir gastos.
          </p>
          <p className="mt-2.5">
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
      <span className="text-tienda-tenue">{etiqueta}</span>
      <span className="tabular-nums text-tienda-texto">{valor}</span>
    </div>
  );
}
