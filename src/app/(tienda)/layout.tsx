import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { BotonCarrito } from "@/components/tienda/boton-carrito";
import { datosDeContacto } from "@/lib/tienda";

/**
 * La tienda.
 *
 * No comparte nada visual con el panel a propósito. El panel es una
 * herramienta de trabajo: denso, gris, hecho para hacer veinte cosas
 * rápido. Esto es un escaparate, y tiene que respirar.
 *
 * Los colores, los radios y las curvas viven en `globals.css` bajo el
 * prefijo `tienda-`, separados de los del panel: un ajuste allá para que
 * una tabla se lea mejor no tiene por qué cambiarle el fondo a la tienda.
 *
 * Tampoco sigue el modo oscuro del sistema: es oscura siempre. Una marca
 * de cosmética artesanal se ve como se ve, no según lo que tenga
 * configurado el teléfono de quien entra.
 */

/** Los títulos. Condensada, con el interletrado apretado de la referencia. */
const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--fuente-display",
  display: "swap",
});

/** Todo lo demás. */
const cuerpo = Inter({
  subsets: ["latin"],
  variable: "--fuente-cuerpo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LILUS — Jabones artesanales",
    template: "%s · LILUS",
  },
  description:
    "Jabones y cosmética artesanal hechos en Ecuador. Glicerina, aceites vegetales y recetas propias.",
};

export default async function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contacto = await datosDeContacto();

  return (
    <div
      className={`${display.variable} ${cuerpo.variable} font-cuerpo min-h-screen bg-tienda-fondo text-tienda-texto flex flex-col antialiased`}
    >
      {/*
        Sin JavaScript, todo lo que espera para aparecer se quedaría
        invisible y la tienda saldría en negro. Esto la devuelve entera:
        sin animación, pero completa.
      */}
      <noscript>
        <style>{`.revelar { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>

      <header className="sticky top-0 z-40 border-b border-tienda-linea bg-tienda-fondo/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="group flex items-center gap-3 min-w-0">
            <Image
              src="/brand/lilus-logo.png"
              alt=""
              width={36}
              height={36}
              className="rounded-full shrink-0"
            />
            <span className="font-display text-2xl leading-none pt-1 tracking-[-0.02em] transition-colors duration-[400ms] ease-tienda group-hover:text-tienda-acento">
              LILUS
            </span>
          </Link>

          <BotonCarrito />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-32 border-t border-tienda-linea">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-10 py-16 space-y-4 text-sm text-tienda-tenue">
          <p className="font-display text-3xl tracking-[-0.02em] text-tienda-texto">
            LILUS
          </p>
          <p>Hechos en Ecuador. Enviamos a todo el país por Servientrega.</p>

          {(contacto.whatsapp || contacto.instagram) && (
            <p className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              {contacto.whatsapp && (
                <Externo href={contacto.whatsapp}>
                  Escríbenos por WhatsApp
                </Externo>
              )}
              {contacto.instagram && (
                <Externo href={contacto.instagram}>
                  @{contacto.instagramUsuario}
                </Externo>
              )}
            </p>
          )}

          <p className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <Interno href="/legal/terminos">Condiciones de compra</Interno>
            <Interno href="/legal/devoluciones">Cambios y devoluciones</Interno>
            <Interno href="/legal/privacidad">Tus datos</Interno>
          </p>

          <p className="max-w-lg pt-4 text-xs leading-relaxed text-tienda-tenue/70">
            Nuestros productos son cosméticos de higiene y cuidado personal. No
            son medicamentos y no tratan ni curan ninguna enfermedad. Si tienes
            una condición en la piel, consulta a un profesional de la salud.
          </p>
        </div>
      </footer>
    </div>
  );
}

/** Los enlaces usan la transición de color de 400 ms de la referencia. */
const claseEnlace =
  "transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto";

function Interno({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={claseEnlace}>
      {children}
    </Link>
  );
}

function Externo({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={claseEnlace}>
      {children}
    </a>
  );
}
