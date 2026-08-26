import Link from "next/link";
import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { Cabecera } from "@/components/tienda/cabecera";
import { BarraPromo } from "@/components/tienda/barra-promo";
import {
  datosDeContacto,
  nombreDeMarca,
  barraDePromocion,
} from "@/lib/tienda";

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
  const [contacto, marca, promo] = await Promise.all([
    datosDeContacto(),
    nombreDeMarca(),
    barraDePromocion(),
  ]);

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

      {/*
        La cinta va ENCIMA de la cabecera y se va con el scroll. La
        cabecera se queda pegada arriba; una promoción que ocupa sitio en
        todas las pantallas todo el rato molesta más de lo que vende.
      */}
      {promo && <BarraPromo texto={promo.texto} enlace={promo.enlace} />}

      <Cabecera marca={marca} />

      <main className="flex-1">{children}</main>

      <footer className="mt-32 border-t border-tienda-linea">
        <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* La marca y lo que hay que decir del producto */}
            <div className="lg:col-span-2">
              <p className="font-display text-4xl tracking-[0.02em] text-white">
                {marca}
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-tienda-tenue">
                Jabones y cosmética artesanal hechos a mano en Ecuador.
                Enviamos a todo el país por Servientrega.
              </p>

              {(contacto.whatsapp || contacto.instagram) && (
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {contacto.whatsapp && (
                    <Externo href={contacto.whatsapp}>WhatsApp</Externo>
                  )}
                  {contacto.instagram && (
                    <Externo href={contacto.instagram}>
                      @{contacto.instagramUsuario}
                    </Externo>
                  )}
                </div>
              )}
            </div>

            <ColumnaPie titulo="Navegar">
              <Interno href="/">Inicio</Interno>
              <Interno href="/tienda">Tienda</Interno>
              <Interno href="/nosotros">Nosotros</Interno>
              <Interno href="/contacto">Contacto</Interno>
            </ColumnaPie>

            <ColumnaPie titulo="Legal">
              <Interno href="/legal/terminos">Condiciones de compra</Interno>
              <Interno href="/legal/devoluciones">Cambios y devoluciones</Interno>
              <Interno href="/legal/privacidad">Tus datos</Interno>
            </ColumnaPie>
          </div>

          <div className="mt-16 border-t border-tienda-linea pt-8">
            <p className="max-w-2xl text-xs leading-relaxed text-tienda-tenue/70">
              Nuestros productos son cosméticos de higiene y cuidado personal.
              No son medicamentos y no tratan ni curan ninguna enfermedad. Si
              tienes una condición en la piel, consulta a un profesional de la
              salud.
            </p>
            <p className="mt-6 text-xs text-tienda-tenue/70">
              {marca} © {new Date().getFullYear()} · Hecho en Ecuador
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ColumnaPie({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-tienda-tenue/60">
        {titulo}
      </p>
      <ul className="mt-5 space-y-3 text-sm">
        {/*
          Cada enlace en su <li>. Un pie es una lista de enlaces, y
          anunciarla como tal le dice a quien usa lector de pantalla
          cuántos hay antes de recorrerlos.
        */}
        {Array.isArray(children)
          ? children.map((hijo, i) => <li key={i}>{hijo}</li>)
          : <li>{children}</li>}
      </ul>
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
