import Link from "next/link";
import { listarCatalogo, type ArticuloResumen } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";
import { Revelar } from "@/components/tienda/revelar";

/**
 * La portada.
 *
 * Deja de ser el catálogo entero: eso vive ahora en /tienda. Aquí van la
 * entrada, los packs —que es lo que conviene que se lleven— y un puente a
 * la historia.
 *
 * Poner los 26 artículos en la primera pantalla obligaba a decidir antes
 * de haber entendido qué es esto. Los cinco packs son una puerta mejor:
 * salen más baratos que comprar lo mismo suelto y son mejor primera
 * compra que un jabón de cuatro dólares con tres cincuenta de envío.
 */

export const revalidate = 1800;

export default async function Portada() {
  const { packs } = await listarCatalogo();

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <section className="py-[120px] sm:py-[200px]">
        <Revelar variante="enfocar" className="max-w-4xl">
          <h1 className="font-display text-6xl sm:text-8xl lg:text-9xl leading-[0.92] tracking-[-0.02em] text-white text-balance">
            Un respiro para tu piel
          </h1>
        </Revelar>

        <Revelar retardo={120} className="mt-10 max-w-xl">
          <p className="text-base leading-[1.7] text-tienda-tenue text-pretty">
            Jabones de glicerina hechos a mano en Ecuador, con recetas propias
            que se fueron corrigiendo con los años. Cada barra se corta y se
            etiqueta a mano, con su lote y su fecha.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Boton href="/tienda" principal>
              Ver el catálogo
            </Boton>
            <Boton href="/nosotros">Cómo lo hacemos</Boton>
          </div>
        </Revelar>
      </section>

      {packs.length > 0 && (
        <section className="pb-[120px]">
          <Revelar className="mb-12 flex items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-[-0.02em] text-white">
                Packs
              </h2>
              <p className="mt-3 text-sm text-tienda-tenue">
                Salen mejor que comprar lo mismo por separado.
              </p>
            </div>
            <Link
              href="/tienda"
              className="hidden shrink-0 text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto sm:block"
            >
              Ver todo
            </Link>
          </Revelar>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-14 lg:grid-cols-3">
            {packs.map((a, i) => (
              <Revelar
                as="li"
                key={`${a.tipo}:${a.id}`}
                variante={i % 2 === 0 ? "inclinar" : "inclinar-derecha"}
                retardo={(i % 3) * 80}
              >
                <Tarjeta articulo={a} prioridad={i < 3} />
              </Revelar>
            ))}
          </ul>
        </section>
      )}

      <Revelar as="section" variante="enfocar" className="pb-[120px]">
        <div className="rounded-tienda-sm border border-tienda-linea px-8 py-16 sm:rounded-tienda sm:px-16 sm:py-24">
          <p className="max-w-2xl font-display text-3xl leading-[1.15] tracking-[-0.01em] text-white text-balance sm:text-5xl">
            Sacamos de las fórmulas los ingredientes que no podían funcionar,
            aunque quedaran bien en la etiqueta.
          </p>
          <Link
            href="/nosotros"
            className="mt-10 inline-block text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
          >
            Por qué lo hicimos
          </Link>
        </div>
      </Revelar>
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
    <Link
      href={href}
      className={`inline-block rounded-full px-8 py-4 text-center text-sm font-medium transition-[background-color,color,border-color,transform] duration-[400ms] ease-tienda active:scale-[0.97] active:duration-100 active:ease-tienda-tap ${
        principal
          ? "bg-tienda-texto text-tienda-fondo hover:bg-tienda-acento"
          : "border border-tienda-linea text-tienda-texto hover:border-tienda-texto hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}

function Tarjeta({
  articulo,
  prioridad,
}: {
  articulo: ArticuloResumen;
  prioridad: boolean;
}) {
  return (
    <article className="flex h-full flex-col">
      <Link href={`/tienda/${articulo.slug}`} className="group">
        <div className="relative aspect-square overflow-hidden rounded-tienda-sm bg-tienda-velo sm:rounded-tienda">
          <ImagenArticulo
            url={articulo.imagen}
            alt={articulo.imagenAlt}
            nombre={articulo.nombre}
            prioridad={prioridad}
            className="transition-transform duration-700 ease-tienda group-hover:scale-[1.04]"
          />
        </div>
        <h3 className="mt-5 font-display text-2xl leading-tight tracking-[-0.02em] text-white transition-colors duration-[400ms] ease-tienda group-hover:text-tienda-acento">
          {articulo.nombre}
        </h3>
      </Link>

      {articulo.tagline && (
        <p className="mt-1.5 text-sm leading-snug text-tienda-tenue text-pretty">
          {articulo.tagline}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="tabular-nums text-tienda-texto">
          {formatCurrency(articulo.precio)}
        </span>
        <BotonAgregar articulo={articulo} />
      </div>
    </article>
  );
}
