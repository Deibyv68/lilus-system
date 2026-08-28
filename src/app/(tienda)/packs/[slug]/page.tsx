import { CalculadoraDeEnvio } from "@/components/tienda/calculadora-envio";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  obtenerPackPresentacion,
  otrosPacks,
  opcionesDeEnvio,
} from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { DIAS_PREPARACION } from "@/lib/politicas";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";
import { Revelar } from "@/components/tienda/revelar";
import { PiezaDelPack } from "@/components/tienda/pieza-del-pack";

/**
 * La presentación de un pack.
 *
 * Es distinta de `/tienda/[slug]`, que es la ficha de compra: rápida,
 * con el precio y el botón arriba. Esta se lee: cuenta qué es el pack,
 * qué trae y por qué esas cosas van juntas. La una vende a quien ya
 * decidió; la otra convence a quien todavía no.
 *
 * ── El ahorro es el argumento ──
 *
 * No es un adorno de marketing: es una resta contra los precios reales de
 * la base. Si mañana sube el precio de un jabón, el número cambia solo.
 * Un descuento inventado se queda viejo; este no puede.
 */

export const revalidate = 1800;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pack = await obtenerPackPresentacion(slug);
  if (!pack) return {};

  return {
    title: pack.nombre,
    description:
      pack.tagline ?? pack.descripcion?.slice(0, 155) ?? undefined,
    openGraph: {
      title: `${pack.nombre} · LILUS`,
      description: pack.tagline ?? undefined,
      images: pack.imagenes[0] ? [pack.imagenes[0].url] : undefined,
    },
  };
}

export default async function PresentacionPack({ params }: Props) {
  const { slug } = await params;
  const [pack, zonas] = await Promise.all([
    obtenerPackPresentacion(slug),
    opcionesDeEnvio(),
  ]);

  if (!pack) notFound();

  const otros = await otrosPacks(pack.slug);
  const piezas = pack.contenido.reduce((n, c) => n + c.cantidad, 0);

  const paraCarrito = {
    tipo: "pack" as const,
    id: pack.id,
    slug: pack.slug,
    nombre: pack.nombre,
    tagline: pack.tagline,
    precio: pack.precio,
    imagen: pack.imagenes[0]?.url ?? null,
    imagenAlt: pack.imagenes[0]?.alt ?? null,
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <div className="pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 py-2 text-sm text-tienda-tenue transition-colors duration-[400ms] ease-tienda hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </div>

      {/* ── Entrada ── */}
      <section className="grid gap-12 py-16 lg:grid-cols-2 lg:items-center lg:gap-20 lg:py-28">
        <Revelar variante="enfocar">
          <p className="font-display text-lg tracking-[0.08em] text-tienda-tenue">
            Pack de {piezas} piezas
          </p>

          <h1 className="mt-4 font-display text-6xl leading-[0.92] tracking-[-0.02em] text-balance text-white sm:text-8xl">
            {pack.nombre}
          </h1>

          {pack.tagline && (
            <p className="mt-6 max-w-md text-lg leading-[1.6] text-pretty text-tienda-texto">
              {pack.tagline}
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-display text-5xl tabular-nums text-white">
              {formatCurrency(pack.precio)}
            </span>
            {pack.ahorro > 0 && (
              <span className="text-sm text-tienda-tenue">
                <span className="line-through">
                  {formatCurrency(pack.precioSuelto)}
                </span>{" "}
                comprándolo suelto
              </span>
            )}
          </div>

          {pack.ahorro > 0 && (
            <p className="mt-3 inline-block rounded-full bg-tienda-acento/15 px-4 py-1.5 text-sm text-tienda-acento">
              Ahorras {formatCurrency(pack.ahorro)}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <BotonAgregar articulo={paraCarrito} className="w-full sm:w-auto" />
            <Link
              href={`/tienda/${pack.slug}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-tienda-linea px-6 py-3 text-sm font-medium text-tienda-texto transition-[border-color,color,transform] duration-[400ms] ease-tienda hover:border-tienda-texto hover:text-white active:scale-[0.97] active:duration-100 active:ease-tienda-tap"
            >
              Ver la ficha
              <ArrowUpRight className="size-4" strokeWidth={1.5} />
            </Link>
          </div>
        </Revelar>

        {/*
          `enfocar` y no una variante inclinada: esta imagen está pegada al
          borde derecho del contenido, y las inclinadas se desplazan y
          rotan hacia fuera mientras esperan ocultas. Medido: 19 px de
          desborde horizontal en toda la página.
        */}
        <Revelar variante="enfocar" retardo={120}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-tienda-sm bg-tienda-velo sm:rounded-tienda">
            <ImagenArticulo
              url={pack.imagenes[0]?.url ?? null}
              alt={pack.imagenes[0]?.alt ?? null}
              nombre={pack.nombre}
              prioridad
            />
          </div>
        </Revelar>
      </section>

      {/* ── Por qué van juntos ── */}
      {pack.descripcion && (
        <section className="max-w-3xl py-16 lg:py-24">
          <Revelar variante="enfocar">
            <p className="font-display text-3xl leading-[1.2] tracking-[-0.01em] text-balance text-white sm:text-5xl">
              {pack.descripcion}
            </p>
          </Revelar>
        </section>
      )}

      {/* ── Qué trae ── */}
      <section className="py-16 lg:py-24">
        <Revelar className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-6xl">
            Qué trae
          </h2>
          <p className="text-sm text-tienda-tenue">
            Toca cada uno para ver qué lleva.
          </p>
        </Revelar>

        <div className="border-t border-tienda-linea">
          {pack.contenido.map((pieza, i) => (
            <Revelar key={pieza.id} retardo={i * 60}>
              <PiezaDelPack pieza={pieza} indice={i} />
            </Revelar>
          ))}
        </div>

        <Revelar className="mt-10 flex flex-wrap items-center justify-between gap-6 rounded-tienda-sm border border-tienda-linea p-8">
          <div>
            <p className="text-tienda-texto">
              {piezas} piezas por {formatCurrency(pack.precio)}
            </p>
            {pack.ahorro > 0 && (
              <p className="mt-1 text-sm text-tienda-tenue">
                Sueltas costarían {formatCurrency(pack.precioSuelto)}.
              </p>
            )}
          </div>
          <BotonAgregar articulo={paraCarrito} />
        </Revelar>
      </section>

      {/* ── Envío ── */}
      {zonas.length > 0 && (
        <section className="py-16 lg:py-24">
          <Revelar className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-5xl">
              Cómo te llega
            </h2>
            <div className="space-y-5 text-base leading-[1.7] text-tienda-tenue">
              <p>
                Cada barra se corta, se etiqueta con su lote y su fecha, y se
                empaca a mano. El pedido sale del taller unos{" "}
                {DIAS_PREPARACION} días después de confirmar el pago.
              </p>
              {/*
                La lista de zonas ya no basta.

                Decía cuánto vale cada zona, no cuánto le cuesta a quien
                lee: para acertar hay que saber que Cumbayá y Sangolquí
                siguen siendo cantón Quito, y mucha gente no lo sabe.
                Marcando el punto no hay nada que deducir.
              */}
              <CalculadoraDeEnvio zonas={zonas} />
            </div>
          </Revelar>
        </section>
      )}

      {/* ── Los otros packs ── */}
      {otros.length > 0 && (
        <section className="py-16 lg:py-24">
          <Revelar className="mb-10">
            <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-5xl">
              Los otros
            </h2>
          </Revelar>

          <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:px-0">
            {otros.map((o, i) => (
              <Revelar
                as="li"
                key={o.id}
                retardo={i * 60}
                className="w-[62%] shrink-0 snap-start sm:w-[40%] lg:w-auto"
              >
                <Link href={`/packs/${o.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-tienda-sm bg-tienda-velo">
                    <ImagenArticulo
                      url={o.imagen}
                      alt={o.imagenAlt}
                      nombre={o.nombre}
                      className="transition-transform duration-700 ease-tienda group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-4 font-display text-xl leading-tight tracking-[-0.01em] text-white transition-colors duration-[400ms] ease-tienda group-hover:text-tienda-acento">
                    {o.nombre}
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-tienda-tenue">
                    {formatCurrency(o.precio)}
                  </p>
                </Link>
              </Revelar>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
