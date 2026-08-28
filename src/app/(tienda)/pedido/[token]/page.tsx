import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  buscarPedidoPorToken,
  datosDeCobro,
  datosDeContacto,
  cuentasDeCobro,
} from "@/lib/tienda";
import { qrComoDataUri } from "@/lib/qr";
import { SubirComprobante } from "./subir-comprobante";
import { ElegirCuenta } from "./elegir-cuenta";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { estadoDePago } from "@/lib/pago-del-pedido";

/**
 * El pedido, visto por quien lo hizo.
 *
 * Es la pantalla de "gracias" y la de seguimiento a la vez, y a propósito:
 * la dirección se manda por correo y la persona vuelve a esta misma página
 * dentro de tres días a ver si ya salió. Dos pantallas distintas para eso
 * serían dos sitios donde mirar.
 *
 * Se entra con el token y sin contraseña. Eso es deliberado — pedirle una
 * cuenta a alguien que compró jabón una vez es pedir demasiado — pero
 * implica que la dirección ES la llave: por eso el token es aleatorio y
 * largo, y por eso la página no se indexa.
 */

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

// Nunca cacheada: el estado cambia cuando la dueña lo mueve en el panel, y
// quien entra lo hace justamente para ver si cambió.
export const dynamic = "force-dynamic";

const ESTADOS: Record<string, { titulo: string; detalle: string }> = {
  PENDING: {
    titulo: "Recibimos tu pedido",
    detalle:
      "Nos falta ver la transferencia. Apenas la confirmemos, empezamos a prepararlo.",
  },
  PAID: {
    titulo: "Pago confirmado",
    detalle: "Ya estamos preparando tu pedido. Te avisamos cuando salga.",
  },
  PACKED: {
    titulo: "Tu pedido está listo",
    detalle: "Empaquetado y esperando a la transportadora.",
  },
  SHIPPED: {
    titulo: "Tu pedido va en camino",
    detalle: "Ya salió. Abajo está la guía para seguirlo.",
  },
  DELIVERED: {
    titulo: "Entregado",
    detalle: "Esperamos que lo disfrutes. Gracias por comprarnos.",
  },
  CANCELLED: {
    titulo: "Pedido cancelado",
    detalle: "Si crees que es un error, escríbenos y lo revisamos.",
  },
};

export default async function PaginaPedido({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [pedido, cobro, contacto, cuentas] = await Promise.all([
    buscarPedidoPorToken(token),
    datosDeCobro(),
    datosDeContacto(),
    cuentasDeCobro(),
  ]);

  if (!pedido) notFound();

  /*
    El QR solo hace falta mientras esté por pagar.

    Si la dueña subió la captura del código desde la app del banco, se usa
    esa. Solo si no hay imagen se genera uno a partir del enlace, que es
    una aproximación: el QR que emite la red de pagos no tiene por qué
    codificar la misma cadena que el enlace de compartir.
  */
  const qr =
    pedido.status !== "PENDING"
      ? null
      : cobro.qrSubido
        ? { src: cobro.qrSubido, propio: true }
        : cobro.deuna
          ? await qrComoDataUri(cobro.deuna).then((d) =>
              d ? { src: d, propio: false } : null
            )
          : null;

  const hayCuenta = cuentas.length > 0;

  /*
    Cuánto se ha confirmado de este pedido.

    Solo cuenta lo que una persona miró y aceptó. Lo que leyó el OCR no
    entra: decirle a quien compró «recibimos tu pago» porque una máquina
    creyó leer una cifra en una foto es prometer algo que nadie ha
    comprobado.
  */
  const pago = estadoDePago(pedido.comprobantes, pedido.total);

  const estado = ESTADOS[pedido.status] ?? ESTADOS.PENDING;
  const primerNombre = pedido.customer.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-sm text-tienda-tenue">
        Pedido {pedido.orderNumber} · {formatDate(pedido.createdAt)}
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight text-balance">
        {primerNombre}, {estado.titulo.toLowerCase()}
      </h1>
      <p className="mt-3 text-tienda-tenue text-pretty">{estado.detalle}</p>

      {pedido.status === "PENDING" && (
        <section className="mt-8 rounded-xl border border-tienda-linea bg-tienda-fondo-alt p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-tienda-tenue">
            Cómo pagar
          </h2>

          {/*
            El monto va primero y en grande, antes que el QR.

            No es jerarquía visual porque sí: el enlace de DeUna NO lleva
            el monto puesto —eso exige la API de comercios, que a su vez
            exige RUC— así que la persona tiene que escribirlo a mano. Si
            el número está escondido, lo escribe mal.
          */}
          <p className="mt-4 font-display text-5xl leading-none text-white">
            {formatCurrency(pedido.total)}
          </p>
          <p className="mt-2 text-sm text-tienda-tenue">
            Pon <strong className="font-medium text-tienda-texto">{pedido.orderNumber}</strong>{" "}
            como referencia.
          </p>

          {(cobro.deuna || qr) && (
            <div className="mt-6 border-t border-tienda-linea pt-6">
              {/*
                El botón va antes que el QR a propósito.

                Casi todo el mundo abre esto en el teléfono, y desde el
                teléfono no se puede escanear un código que está en esa
                misma pantalla. El botón abre DeUna directamente; el QR es
                para quien esté en el computador.
              */}
              {cobro.deuna && (
                <a
                  href={cobro.deuna}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-full bg-tienda-acento px-6 py-4 text-center text-sm font-medium text-tienda-fondo transition-[background-color,transform] duration-[400ms] ease-tienda hover:bg-tienda-texto active:scale-[0.98] active:duration-100"
                >
                  Pagar con DeUna
                </a>
              )}

              {qr && (
                <div className={`flex flex-col items-center ${cobro.deuna ? "mt-6" : ""}`}>
                  <p className="mb-3 text-xs text-tienda-tenue">
                    {cobro.deuna
                      ? "O escanéalo desde otro teléfono"
                      : "Escanea este código con la app de tu banco"}
                  </p>
                  {/*
                    El QR es un PNG generado en el servidor y va como data
                    URI. Con <img> y no con next/image: el optimizador no
                    tiene nada que optimizar aquí y reescalar un código
                    solo lo puede volver ilegible.
                  */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qr.src}
                    alt={`Código QR para pagar el pedido ${pedido.orderNumber}`}
                    width={200}
                    height={200}
                    /*
                      `bg-white` y `object-contain`: la captura que sube la
                      dueña puede venir con fondo claro y proporción rara, y
                      un QR recortado o sobre fondo oscuro deja de leerse.
                    */
                    className="h-[200px] w-[200px] rounded-lg bg-white object-contain p-2"
                  />
                </div>
              )}
            </div>
          )}

          {/*
            Sin ninguna cuenta activa no se abre el bloque, aunque haya nota.
            La nota es "para lo que no encaje en un campo" — suelta, sin una
            cuenta al lado, no dice a dónde mandar el dinero y encima puede
            contradecir a la cuenta que se active después.
          */}
          {hayCuenta && (
            <div className="mt-6 border-t border-tienda-linea pt-6">
              <p className="text-xs uppercase tracking-wide text-tienda-tenue">
                {cobro.deuna ? "O por transferencia" : "Transferencia"}
              </p>

              {/*
                Cada dato con su botón de copiar, y no un bloque de texto.

                Quien transfiere tiene el formulario del banco delante: el
                número va en un campo, el nombre en otro, el monto en otro.
                Copiar todo junto obliga a pegar y borrar lo que sobra cinco
                veces, y ahí es donde se pierde un dígito de la cuenta.

                El monto y la referencia van primero porque son los que más
                se equivocan, y son los que hacen que un pago tarde días en
                identificarse.
              */}
              <div className="mt-3">
                <ElegirCuenta
                  cuentas={cuentas}
                  monto={pedido.total}
                  referencia={pedido.orderNumber}
                />
              </div>

              {/* La nota suelta, si la dueña escribió algo más. */}
              {cobro.banco && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-tienda-tenue">
                  {cobro.banco}
                </p>
              )}
            </div>
          )}

          {/*
            Sin ninguna cuenta cargada no se inventa una: se dice la verdad,
            que los datos van por WhatsApp. Mostrar una cuenta a medias o de
            ejemplo sería mandar dinero a ninguna parte.
          */}
          {!cobro.deuna && !hayCuenta && (
            <p className="mt-4 text-sm text-tienda-tenue">
              Te escribimos por WhatsApp con los datos para pagar. Ten a mano el
              número {pedido.orderNumber}.
            </p>
          )}

          {/*
            Subir el comprobante aquí es el camino corto: llega pegado a
            este pedido, sin que nadie tenga que adivinar de cuál es.
          */}
          <SubirComprobante
            token={token}
            yaSubidos={pedido.comprobantes.map((c) => ({
              id: c.id,
              esPdf: c.tipo === "application/pdf",
              cuando: formatDateTime(c.createdAt),
              aceptado: c.aceptado,
              monto: c.montoConfirmado,
            }))}
            pago={{
              confirmado: pago.confirmado,
              falta: pago.falta,
              esperandoPago: pedido.status === "PENDING",
            }}
          />

          {/*
            El mensaje lleva el número de pedido ya escrito. Sin eso, quien
            recibe el comprobante tiene que adivinar de cuál de los pedidos
            pendientes es.
          */}
          {contacto.whatsapp && (
            <a
              href={`${contacto.whatsapp}?text=${encodeURIComponent(
                `Hola, acabo de hacer el pedido ${pedido.orderNumber}. Les mando el comprobante.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block rounded-full border border-tienda-linea px-6 py-3 text-center text-sm text-tienda-texto transition-colors duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white"
            >
              Ya pagué — enviar comprobante
            </a>
          )}
        </section>
      )}

      {pedido.seguimiento && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-tienda-tenue">
            Seguimiento
          </h2>
          <p className="mt-3 text-sm">
            {pedido.carrier?.name} · guía {pedido.trackingNumber}
          </p>
          <a
            href={pedido.seguimiento}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm underline underline-offset-4"
          >
            Seguir el envío
          </a>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-tienda-tenue">
          Qué pediste
        </h2>
        <ul className="mt-3 divide-y divide-tienda-linea border-y border-tienda-linea">
          {pedido.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="text-tienda-tenue tabular-nums">{i.quantity}×</span>{" "}
                {i.itemName}
              </span>
              <span className="tabular-nums">{formatCurrency(i.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <Fila etiqueta="Productos" valor={formatCurrency(pedido.subtotal)} />
          <Fila etiqueta="Envío" valor={formatCurrency(pedido.shippingCost)} />
          <div className="flex justify-between gap-4 border-t border-tienda-linea pt-2 text-base">
            <dt className="font-medium">Total</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(pedido.total)}
            </dd>
          </div>
        </dl>
      </section>

      {pedido.shippingAddress && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-tienda-tenue">
            A dónde va
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-tienda-texto">
            {pedido.shippingAddress.address}
            <br />
            {pedido.shippingAddress.city}, {pedido.shippingAddress.province}
            {pedido.shippingAddress.reference && (
              <>
                <br />
                <span className="text-tienda-tenue">
                  {pedido.shippingAddress.reference}
                </span>
              </>
            )}
          </p>
        </section>
      )}

      <p className="mt-10 text-sm text-tienda-tenue">
        Guarda esta página: es donde puedes ver cómo va tu pedido.
      </p>

      <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-4">
        Volver al catálogo
      </Link>
    </div>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-tienda-tenue">{etiqueta}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}
