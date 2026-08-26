import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { BotonCarrito } from "@/components/tienda/boton-carrito";
import { datosDeContacto } from "@/lib/tienda";

/**
 * La tienda.
 *
 * No comparte nada visual con el panel a propósito. El panel es una
 * herramienta de trabajo: denso, gris, hecho para hacer veinte cosas
 * rápido. Esto es un escaparate, y tiene que respirar.
 *
 * Va con colores fijos en vez de los tokens de shadcn. Esos los comparte
 * con el panel, y un ajuste allá para que una tabla se lea mejor no tiene
 * por qué cambiarle el fondo a la tienda. Tampoco sigue el modo oscuro:
 * una marca de cosmética artesanal se ve como se ve, y no según lo que
 * tenga configurado el teléfono de quien entra.
 */

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
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/brand/lilus-logo.png"
              alt=""
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
            <span className="font-medium tracking-wide">LILUS</span>
          </Link>

          <BotonCarrito />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-stone-200 mt-20">
        <div className="mx-auto max-w-5xl px-5 py-10 text-sm text-stone-500 space-y-3">
          <p className="text-stone-700">LILUS · Jabones artesanales</p>
          <p>Hechos en Ecuador. Enviamos a todo el país por Servientrega.</p>

          {/*
            Los enlaces salen de Configuración. Si no están cargados no se
            pinta nada: un enlace de contacto que no lleva a ningún lado es
            peor que no ofrecerlo.
          */}
          {(contacto.whatsapp || contacto.instagram) && (
            <p className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
              {contacto.whatsapp && (
                <a
                  href={contacto.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-stone-900 transition-colors"
                >
                  Escríbenos por WhatsApp
                </a>
              )}
              {contacto.instagram && (
                <a
                  href={contacto.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-stone-900 transition-colors"
                >
                  @{contacto.instagramUsuario}
                </a>
              )}
            </p>
          )}
          <p className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            <Link href="/legal/terminos" className="underline underline-offset-4 hover:text-stone-900 transition-colors">
              Condiciones de compra
            </Link>
            <Link href="/legal/devoluciones" className="underline underline-offset-4 hover:text-stone-900 transition-colors">
              Cambios y devoluciones
            </Link>
            <Link href="/legal/privacidad" className="underline underline-offset-4 hover:text-stone-900 transition-colors">
              Tus datos
            </Link>
          </p>

          <p className="text-xs leading-relaxed max-w-lg">
            Nuestros productos son cosméticos de higiene y cuidado personal. No
            son medicamentos y no tratan ni curan ninguna enfermedad. Si tienes
            una condición en la piel, consulta a un profesional de la salud.
          </p>
        </div>
      </footer>
    </div>
  );
}
