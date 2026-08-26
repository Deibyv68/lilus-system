"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCarrito, subtotal } from "@/lib/carrito";
import { formatCurrency } from "@/lib/format";
import { crearPedidoWebAction } from "./actions";

/**
 * El checkout.
 *
 * Un solo formulario y no tres pantallas. Son siete campos: partirlos en
 * pasos agrega clics y pantallas de carga sin quitarle trabajo a nadie, y
 * cada salto es una oportunidad más de abandonar. Lo que sí se separa
 * visualmente son los bloques, para que se lea de arriba abajo.
 *
 * El total se arma acá con el precio de la zona elegida, así que cambia en
 * el momento en que se toca. Nadie llega al final con una sorpresa — que es
 * lo que pasa cuando el envío aparece recién después de dar los datos.
 *
 * Igual, este total es el que se muestra: el que se cobra lo recalcula el
 * servidor. Ver la nota de `crearPedidoWebAction`.
 */

type Zona = {
  id: string;
  nombre: string;
  porDefecto: boolean;
  precio: number;
  transportadora: string;
};

export function FormularioCheckout({ zonas }: { zonas: Zona[] }) {
  const router = useRouter();
  const [enviando, startTransition] = useTransition();
  const { lineas, listo, vaciar } = useCarrito();

  const [zonaId, setZonaId] = useState(
    zonas.find((z) => z.porDefecto)?.id ?? zonas[0].id
  );
  const [error, setError] = useState<string | null>(null);

  const zona = zonas.find((z) => z.id === zonaId)!;
  const productos = subtotal(lineas);
  const total = productos + zona.precio;

  if (!listo) return <Marco><div className="h-64" /></Marco>;

  if (lineas.length === 0) {
    return (
      <Marco>
        <p className="text-stone-600">
          Tu carrito está vacío, así que no hay nada que pedir todavía.
        </p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Ver el catálogo
        </Link>
      </Marco>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);

    startTransition(async () => {
      const r = await crearPedidoWebAction({
        cliente: {
          nombre: String(f.get("nombre") ?? ""),
          telefono: String(f.get("telefono") ?? ""),
          email: String(f.get("email") ?? ""),
          cedula: String(f.get("cedula") ?? ""),
        },
        direccion: {
          zonaId,
          provincia: String(f.get("provincia") ?? ""),
          ciudad: String(f.get("ciudad") ?? ""),
          calle: String(f.get("calle") ?? ""),
          referencia: String(f.get("referencia") ?? ""),
        },
        nota: String(f.get("nota") ?? ""),
        // Del carrito solo van el qué y el cuánto. El precio lo pone el
        // servidor.
        lineas: lineas.map((l) => ({
          tipo: l.tipo,
          id: l.id,
          cantidad: l.cantidad,
        })),
      });

      if (!r.ok) {
        setError(r.error);
        return;
      }

      // Se vacía recién con el pedido ya creado. Si se vaciara antes y algo
      // fallara, la persona se queda sin carrito y sin pedido.
      vaciar();
      router.push(`/pedido/${r.token}`);
    });
  }

  return (
    <Marco>
      <Link
        href="/carrito"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al carrito
      </Link>

      <form onSubmit={onSubmit} className="mt-8 space-y-9">
        <Bloque titulo="Tus datos">
          <Campo nombre="nombre" etiqueta="Nombre y apellido" requerido autoComplete="name" />
          <Campo
            nombre="telefono"
            etiqueta="Teléfono"
            tipo="tel"
            requerido
            autoComplete="tel"
            ayuda="Para que la transportadora te ubique."
          />
          <Campo
            nombre="email"
            etiqueta="Correo"
            tipo="email"
            requerido
            autoComplete="email"
            ayuda="Ahí te mandamos el estado del pedido."
          />
          <Campo
            nombre="cedula"
            etiqueta="Cédula o RUC (opcional)"
            autoComplete="off"
            ayuda="Solo si necesitas factura."
          />
        </Bloque>

        <Bloque titulo="A dónde lo enviamos">
          <fieldset>
            <legend className="mb-2 text-sm text-stone-600">Zona</legend>
            <div className="space-y-2">
              {zonas.map((z) => (
                <label
                  key={z.id}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors ${
                    z.id === zonaId
                      ? "border-stone-900 bg-white"
                      : "border-stone-300 hover:bg-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="zona"
                      value={z.id}
                      checked={z.id === zonaId}
                      onChange={() => setZonaId(z.id)}
                      className="size-4 accent-stone-900"
                    />
                    <span>
                      <span className="block text-sm">{z.nombre}</span>
                      <span className="block text-xs text-stone-500">
                        {z.transportadora}
                      </span>
                    </span>
                  </span>
                  <span className="tabular-nums text-sm">
                    {formatCurrency(z.precio)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Campo nombre="provincia" etiqueta="Provincia" requerido autoComplete="address-level1" />
          <Campo nombre="ciudad" etiqueta="Ciudad" requerido autoComplete="address-level2" />
          <Campo
            nombre="calle"
            etiqueta="Dirección"
            requerido
            autoComplete="street-address"
            ayuda="Calle principal, número y calle secundaria."
          />
          <Campo
            nombre="referencia"
            etiqueta="Referencia (opcional)"
            ayuda="Un punto conocido cerca, color de la casa…"
          />
          <Campo nombre="nota" etiqueta="Nota para nosotros (opcional)" />
        </Bloque>

        <Bloque titulo="Total">
          <dl className="space-y-2 text-sm">
            <Fila etiqueta="Productos" valor={formatCurrency(productos)} />
            <Fila etiqueta={`Envío · ${zona.nombre}`} valor={formatCurrency(zona.precio)} />
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-2 text-base">
              <dt className="font-medium">Total</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(total)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-stone-100 px-4 py-3 text-sm text-stone-600">
            El pago es por <strong className="font-medium">transferencia bancaria</strong>.
            Al confirmar te damos los datos de la cuenta y el número de tu
            pedido. Lo preparamos apenas veamos la transferencia.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}

          {/*
            El aviso va pegado al boton y no escondido en el pie. Es el
            momento en que la persona entrega su direccion y su telefono:
            si va a saber que existe una politica, tiene que ser aqui.
          */}
          <p className="mt-5 text-xs leading-relaxed text-stone-500">
            Al enviar el pedido aceptas las{" "}
            <Link href="/legal/terminos" className="underline underline-offset-2">
              condiciones de compra
            </Link>{" "}
            y que tratemos tus datos para enviarte el pedido, como se explica
            en{" "}
            <Link href="/legal/privacidad" className="underline underline-offset-2">
              tus datos
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={enviando}
            className="mt-3 w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-700 disabled:opacity-60"
          >
            {enviando ? "Creando tu pedido…" : "Confirmar pedido"}
          </button>
        </Bloque>
      </form>
    </Marco>
  );
}

function Campo({
  nombre,
  etiqueta,
  tipo = "text",
  requerido = false,
  ayuda,
  autoComplete,
}: {
  nombre: string;
  etiqueta: string;
  tipo?: string;
  requerido?: boolean;
  ayuda?: string;
  autoComplete?: string;
}) {
  const idAyuda = ayuda ? `${nombre}-ayuda` : undefined;
  return (
    <div>
      <label htmlFor={nombre} className="block text-sm text-stone-600">
        {etiqueta}
      </label>
      <input
        id={nombre}
        name={nombre}
        type={tipo}
        required={requerido}
        autoComplete={autoComplete}
        aria-describedby={idAyuda}
        className="mt-1.5 w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-stone-900"
      />
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-xs text-stone-500">
          {ayuda}
        </p>
      )}
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

function Bloque({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
        {titulo}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-tight">Tu pedido</h1>
      {children}
    </div>
  );
}
