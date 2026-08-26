import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { buscarPorSlug, opcionesDeEnvio } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";

/**
 * La ficha de un artículo.
 *
 * Esta ruta es dinámica y cuelga de la raíz, así que en teoría atrapa
 * cualquier dirección. En la práctica no pisa nada: `/sistema`, `/login` y
 * `/api` son rutas estáticas y Next las resuelve antes que a la dinámica.
 * Lo que no exista cae en el 404 de abajo, que es lo que corresponde.
 */

export const revalidate = 1800;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articulo = await buscarPorSlug(slug);
  if (!articulo) return {};

  return {
    title: articulo.nombre,
    description: articulo.tagline ?? articulo.descripcion?.slice(0, 155) ?? undefined,
    openGraph: {
      title: `${articulo.nombre} · LILUS`,
      description: articulo.tagline ?? undefined,
      images: articulo.imagenes[0] ? [articulo.imagenes[0].url] : undefined,
    },
  };
}

export default async function FichaArticulo({ params }: Props) {
  const { slug } = await params;
  const [articulo, zonas] = await Promise.all([
    buscarPorSlug(slug),
    opcionesDeEnvio(),
  ]);
  if (!articulo) notFound();

  const portada = articulo.imagenes[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
            <ImagenArticulo
              url={portada?.url ?? null}
              alt={portada?.alt ?? null}
              nombre={articulo.nombre}
              prioridad
            />
          </div>

          {articulo.imagenes.length > 1 && (
            <ul className="grid grid-cols-4 gap-3">
              {articulo.imagenes.slice(1).map((img) => (
                <li
                  key={img.url}
                  className="relative aspect-square overflow-hidden rounded-lg bg-stone-100"
                >
                  <ImagenArticulo
                    url={img.url}
                    alt={img.alt}
                    nombre={articulo.nombre}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-balance">
            {articulo.nombre}
          </h1>

          {articulo.tagline && (
            <p className="mt-2 text-stone-600 text-pretty">{articulo.tagline}</p>
          )}

          <p className="mt-6 text-2xl tabular-nums">
            {formatCurrency(articulo.precio)}
          </p>

          <BotonAgregar articulo={articulo} className="mt-5 w-full sm:w-auto" />

          {articulo.contenido.length > 0 && (
            <Bloque titulo="Qué trae">
              <ul className="space-y-1.5">
                {articulo.contenido.map((c) => (
                  <li key={c.nombre} className="flex gap-2">
                    <span className="text-stone-400 tabular-nums">
                      {c.cantidad}×
                    </span>
                    {c.slug ? (
                      <Link
                        href={`/${c.slug}`}
                        className="underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900"
                      >
                        {c.nombre}
                      </Link>
                    ) : (
                      <span>{c.nombre}</span>
                    )}
                  </li>
                ))}
              </ul>
            </Bloque>
          )}

          {articulo.descripcion && (
            <Bloque titulo="Sobre este producto">
              {/*
                La descripción se escribe con líneas en blanco entre párrafos.
                Se parte por ahí en vez de meter HTML en la base: lo que se
                guarda es texto, y así nadie puede inyectar marcado desde el
                formulario del panel.
              */}
              <div className="space-y-3 leading-relaxed">
                {articulo.descripcion
                  .split(/\n\s*\n/)
                  .map((parrafo, i) => (
                    <p key={i} className="text-pretty">
                      {parrafo.trim()}
                    </p>
                  ))}
              </div>
            </Bloque>
          )}

          {articulo.ingredientes && (
            <Bloque titulo="Qué lleva">
              <p className="leading-relaxed text-pretty">{articulo.ingredientes}</p>
            </Bloque>
          )}

          {/*
            Las tarifas salen de la tabla de Envíos, no escritas acá. Estaban
            a mano y eso significaba que el día que la dueña subiera el precio
            del envío, esta página seguiría prometiendo el viejo — que es
            justo la clase de error que nadie nota hasta que un cliente
            reclama.
          */}
          {zonas.length > 0 && (
            <Bloque titulo="Envío">
              <p className="leading-relaxed">
                Enviamos por {zonas[0].transportadora} a todo el Ecuador.
              </p>
              <ul className="mt-2 space-y-1">
                {zonas.map((z) => (
                  <li key={z.id} className="flex justify-between gap-4">
                    <span>{z.nombre}</span>
                    <span className="tabular-nums">
                      {formatCurrency(z.precio)}
                    </span>
                  </li>
                ))}
              </ul>
            </Bloque>
          )}
        </div>
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
    <section className="mt-9 border-t border-stone-200 pt-6">
      <h2 className="text-sm font-medium uppercase tracking-wide text-stone-400">
        {titulo}
      </h2>
      <div className="mt-3 text-stone-700">{children}</div>
    </section>
  );
}
