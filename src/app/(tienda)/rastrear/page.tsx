import type { Metadata } from "next";
import { datosDeContacto } from "@/lib/tienda";
import { Revelar } from "@/components/tienda/revelar";
import { BuscadorDePedido } from "./buscador-pedido";

export const metadata: Metadata = {
  title: "Dónde está mi pedido",
  description:
    "Consulta el estado de tu pedido con tu número y el correo o teléfono con que compraste.",
};

export const revalidate = 1800;

/**
 * «Dónde está mi pedido».
 *
 * Sin cuentas ni contraseñas. El enlace del correo sigue siendo el camino
 * corto; esto es para quien lo perdió. La explicación de por qué se piden
 * dos datos y no solo el número está en `actions.ts`.
 */
export default async function Rastrear() {
  const contacto = await datosDeContacto();

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <section className="py-[120px] sm:py-[180px]">
        <Revelar variante="enfocar" className="max-w-3xl">
          <h1 className="font-display text-6xl leading-[0.95] tracking-[-0.02em] text-white text-balance sm:text-8xl">
            Dónde está mi pedido
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-tienda-tenue">
            Si todavía tienes el correo que te mandamos, el enlace de ahí te
            lleva directo. Si no, búscalo acá.
          </p>
        </Revelar>

        <Revelar retardo={90}>
          <BuscadorDePedido />
        </Revelar>

        <Revelar retardo={160} className="mt-16 max-w-md border-t border-tienda-linea pt-8">
          <h2 className="text-xs uppercase tracking-wide text-tienda-tenue">
            Qué significa cada estado
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ["Pendiente", "Todavía no vemos la transferencia."],
              ["Pagado", "Confirmamos el pago. Empezamos a prepararlo."],
              ["Empaquetado", "Listo y esperando a la transportadora."],
              ["Enviado", "Ya va en camino, con su número de guía."],
              ["Entregado", "Llegó."],
            ].map(([estado, que]) => (
              <div key={estado} className="flex gap-3">
                <dt className="w-28 shrink-0 text-tienda-texto">{estado}</dt>
                <dd className="text-tienda-tenue">{que}</dd>
              </div>
            ))}
          </dl>
        </Revelar>

        {contacto.whatsapp && (
          <Revelar retardo={220} className="mt-12 max-w-md">
            <p className="text-sm text-tienda-tenue">
              ¿No te cuadra algo?{" "}
              <a
                href={contacto.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
              >
                Escríbenos por WhatsApp
              </a>{" "}
              y lo vemos.
            </p>
          </Revelar>
        )}
      </section>
    </div>
  );
}
