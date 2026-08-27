import type { Metadata } from "next";
import Link from "next/link";
import { datosDeContacto, identidadDelVendedor, opcionesDeEnvio } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { DIAS_PREPARACION } from "@/lib/politicas";
import { Revelar } from "@/components/tienda/revelar";
import { Migas } from "@/components/tienda/migas";
import { FormularioDeContacto } from "./formulario";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o Instagram. Contestamos personas.",
};

export const revalidate = 1800;

/**
 * Contacto.
 *
 * Sin formulario a propósito. Un formulario de contacto obliga a montar
 * envío de correo, a vigilar que no lo llene un robot, y sobre todo hace
 * esperar a quien escribe sin saber si llegó. Aquí ya se vende y se
 * atiende por WhatsApp: mandar a la gente ahí es más rápido para ella y
 * para quien contesta.
 *
 * Todo lo de esta página sale de Configuración. Lo que no esté cargado no
 * se pinta, en vez de dejar un enlace que no lleva a ningún lado.
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

      {/* El formulario, centrado y en tarjeta — la forma de la referencia. */}
      <Revelar retardo={80} className="mx-auto mt-16 max-w-3xl sm:mt-20">
        <FormularioDeContacto whatsapp={contacto.whatsapp} />
      </Revelar>

      <div className="mx-auto max-w-2xl space-y-[100px] py-[120px]">
        {contacto.instagram && (
          <Revelar as="section">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Boton href={contacto.instagram} principal>
                @{contacto.instagramUsuario}
              </Boton>
              {contacto.tiktok && <Boton href={contacto.tiktok}>TikTok</Boton>}
            </div>
          </Revelar>
        )}

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

function Boton({
  href,
  children,
  principal = false,
}: {
  href: string;
  children: React.ReactNode;
  principal?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block rounded-full px-8 py-4 text-center text-sm font-medium transition-[background-color,color,border-color,transform] duration-[400ms] ease-tienda active:scale-[0.97] active:duration-100 active:ease-tienda-tap ${
        principal
          ? "bg-tienda-texto text-tienda-fondo hover:bg-tienda-acento"
          : "border border-tienda-linea text-tienda-texto hover:border-tienda-texto hover:text-white"
      }`}
    >
      {children}
    </a>
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
