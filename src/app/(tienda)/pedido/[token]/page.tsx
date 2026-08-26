import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  buscarPedidoPorToken,
  datosDeTransferencia,
  datosDeContacto,
} from "@/lib/tienda";
import { formatCurrency, formatDate } from "@/lib/format";

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
  const [pedido, banco, contacto] = await Promise.all([
    buscarPedidoPorToken(token),
    datosDeTransferencia(),
    datosDeContacto(),
  ]);

  if (!pedido) notFound();

  const estado = ESTADOS[pedido.status] ?? ESTADOS.PENDING;
  const primerNombre = pedido.customer.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-sm text-stone-500">
        Pedido {pedido.orderNumber} · {formatDate(pedido.createdAt)}
      </p>
      <h1 className="mt-2 text-2xl font-medium tracking-tight text-balance">
        {primerNombre}, {estado.titulo.toLowerCase()}
      </h1>
      <p className="mt-3 text-stone-600 text-pretty">{estado.detalle}</p>

      {pedido.status === "PENDING" && (
        <section className="mt-8 rounded-xl border border-stone-300 bg-white p-5">
          <h2 className="text-sm font-medium uppercase tracking-wide text-stone-400">
            Cómo pagar
          </h2>

          {banco ? (
            <>
              {/* Los datos vienen tal como los escribió la dueña, con sus
                  saltos de línea. `whitespace-pre-line` los respeta sin que
                  haya que guardar HTML en la base. */}
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
                {banco}
              </p>
              <p className="mt-4 text-sm text-stone-600">
                Transfiere{" "}
                <strong className="font-medium">
                  {formatCurrency(pedido.total)}
                </strong>{" "}
                y mándanos el comprobante poniendo el número{" "}
                <strong className="font-medium">{pedido.orderNumber}</strong>.
              </p>

              {/*
                El botón lleva el número de pedido ya escrito en el mensaje.
                Sin eso, quien recibe el comprobante tiene que adivinar de
                cuál de los pedidos pendientes es.
              */}
              {contacto.whatsapp && (
                <a
                  href={`${contacto.whatsapp}?text=${encodeURIComponent(
                    `Hola, acabo de hacer el pedido ${pedido.orderNumber}. Les mando el comprobante.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700"
                >
                  Enviar comprobante por WhatsApp
                </a>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-stone-600">
              Te escribimos por WhatsApp con los datos de la cuenta y el total a
              transferir. Ten a mano el número {pedido.orderNumber}.
            </p>
          )}
        </section>
      )}

      {pedido.seguimiento && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-stone-400">
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-stone-400">
          Qué pediste
        </h2>
        <ul className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
          {pedido.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                <span className="text-stone-400 tabular-nums">{i.quantity}×</span>{" "}
                {i.itemName}
              </span>
              <span className="tabular-nums">{formatCurrency(i.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 text-sm">
          <Fila etiqueta="Productos" valor={formatCurrency(pedido.subtotal)} />
          <Fila etiqueta="Envío" valor={formatCurrency(pedido.shippingCost)} />
          <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 text-base">
            <dt className="font-medium">Total</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(pedido.total)}
            </dd>
          </div>
        </dl>
      </section>

      {pedido.shippingAddress && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-stone-400">
            A dónde va
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">
            {pedido.shippingAddress.address}
            <br />
            {pedido.shippingAddress.city}, {pedido.shippingAddress.province}
            {pedido.shippingAddress.reference && (
              <>
                <br />
                <span className="text-stone-500">
                  {pedido.shippingAddress.reference}
                </span>
              </>
            )}
          </p>
        </section>
      )}

      <p className="mt-10 text-sm text-stone-500">
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
      <dt className="text-stone-500">{etiqueta}</dt>
      <dd className="tabular-nums">{valor}</dd>
    </div>
  );
}
