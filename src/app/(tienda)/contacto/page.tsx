import type { Metadata } from "next";
import Link from "next/link";
import { datosDeContacto, identidadDelVendedor, opcionesDeEnvio } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { DIAS_PREPARACION } from "@/lib/politicas";
import { Revelar } from "@/components/tienda/revelar";
import { Migas } from "@/components/tienda/migas";
import { FormularioDeContacto } from "./formulario";
import { Canales } from "./canales";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o Instagram. Contestamos personas.",
};

export const revalidate = 1800;

/**
 * Contacto.
 *
 * ── El orden dice lo que conviene ──
 *
 * Primero los canales directos, después el formulario. El formulario deja
 * a quien escribe esperando sin saber si llegó; WhatsApp le da las dos
 * palomitas, la conversación guardada en su teléfono, y la posibilidad de
 * mandar una foto del comprobante en el mismo hilo.
 *
 * Antes el formulario era lo único que se veía y los enlaces a redes
 * estaban debajo, sueltos, como dos botones sin explicar. Quien llegaba
 * con una duda que le frenaba la compra escribía en un formulario y se
 * iba a esperar.
 *
 * El formulario se queda: hay quien no quiere dar su número.
 *
 * Todo sale de Configuración. Lo que no esté cargado no se pinta, en vez
 * de dejar un enlace que no lleva a ningún lado.
 */
export default async function Contacto() {
  const [contacto, vendedor, zonas] = await Promise.all([
    datosDeContacto(),
    identidadDelVendedor(),
    opcionesDeEnvio(),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <section className="pt-[100px] sm:pt-[140px]">
        <Migas actual="Contacto" />

        <Revelar variante="enfocar" className="mt-8 text-center">
          <h1 className="font-display text-[clamp(3.5rem,13vw,8.5rem)] leading-[0.9] tracking-[-0.03em] text-white">
            Contacto
          </h1>
          <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-tienda-tenue">
            Contestamos personas, no un robot, así que puede tomar unas horas.
            Si es sobre un pedido que ya hiciste, ten a mano su número.
          </p>
        </Revelar>
      </section>

      <Revelar retardo={60} className="mx-auto mt-14 max-w-3xl sm:mt-16">
        <Canales
          canales={{ ...contacto, correo: vendedor.email }}
          mensajePorDefecto={`Hola ${vendedor.nombre}, tengo una pregunta:`}
        />

        {/*
          El enlace a rastrear, aquí y no solo en el menú.

          Buena parte de quien entra a Contacto viene a preguntar por dónde
          va su pedido, y eso lo puede ver ahora mismo sin esperar a que
          nadie le conteste. Ofrecerlo antes del formulario le ahorra el
          mensaje a ella y la respuesta a quien atiende.
        */}
        <p className="mt-6 text-center text-sm text-tienda-tenue">
          ¿Solo quieres saber por dónde va tu pedido?{" "}
          <Link
            href="/rastrear"
            className="text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
          >
            Míralo aquí
          </Link>
          , sin escribirle a nadie.
        </p>
      </Revelar>

      {/* El formulario, centrado y en tarjeta — la forma de la referencia. */}
      <Revelar retardo={80} className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <p className="mb-5 text-center text-xs uppercase tracking-[0.12em] text-tienda-tenue">
          O déjanos un mensaje
        </p>
        <FormularioDeContacto whatsapp={contacto.whatsapp} />
      </Revelar>

      <div className="mx-auto max-w-2xl space-y-[100px] py-[120px]">
        <Bloque titulo="Dónde estamos">
          <p>
            {vendedor.ciudad ? `${vendedor.ciudad}, Ecuador.` : "Ecuador."} No
            tenemos local: es un taller y trabajamos por pedido.
          </p>
          {zonas.length > 0 && (
            <>
              <p>Enviamos a todo el país por {zonas[0].transportadora}:</p>
              <ul className="space-y-1.5 pt-1">
                {zonas.map((z) => (
                  <li key={z.id} className="flex justify-between gap-4 max-w-xs">
                    <span>{z.nombre}</span>
                    <span className="tabular-nums text-tienda-texto">
                      {formatCurrency(z.precio)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Bloque>

        <Bloque titulo="Cuánto tarda">
          <p>
            Un pedido sale del taller unos {DIAS_PREPARACION} días después de
            que confirmamos el pago, más lo que tarde la transportadora. Cuando
            salga te mandamos la guía.
          </p>
        </Bloque>

        <Bloque titulo="Si algo salió mal">
          <p>
            Si te llegó algo equivocado o roto, lo resolvemos nosotros y sin
            costo para ti. Está explicado en{" "}
            <Link
              href="/legal/devoluciones"
              className="text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
            >
              cambios y devoluciones
            </Link>
            .
          </p>
        </Bloque>
      </div>
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
    <Revelar as="section">
      <h2 className="font-display text-4xl leading-none tracking-[-0.01em] text-white">
        {titulo}
      </h2>
      <div className="mt-6 space-y-5 text-base leading-[1.7] text-tienda-tenue text-pretty">
        {children}
      </div>
    </Revelar>
  );
}
