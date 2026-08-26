import Link from "next/link";
import { listarCatalogo, type ArticuloResumen } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";
import { Revelar } from "@/components/tienda/revelar";
import { CarruselProductos } from "@/components/tienda/carrusel-productos";
import { CintaTexto } from "@/components/tienda/cinta-texto";

/**
 * La portada.
 *
 * No es el catálogo: eso vive en /tienda. Aquí va lo que hace falta para
 * que alguien que nunca oyó hablar de LILUS entienda qué es esto y por
 * qué debería importarle, en este orden:
 *
 *   entrada → packs → por qué se hace así → qué más hay → cierre
 *
 * Poner los 26 artículos en la primera pantalla obligaba a decidir antes
 * de haber entendido nada.
 */

export const revalidate = 1800;

export default async function Portada() {
  const { packs, productos } = await listarCatalogo();

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
        <section className="relative py-[120px] sm:py-[200px]">
          {/*
            La marca del año, como en la referencia. Es una firma discreta
            arriba del titular; decorativa, así que no la lee nadie en voz
            alta.
          */}
          <span
            aria-hidden="true"
            className="mb-8 block font-display text-xl tracking-[0.08em] text-tienda-tenue"
          >
            © 18—25
          </span>

          <Revelar variante="enfocar" className="max-w-4xl">
            <h1 className="font-display text-6xl leading-[0.92] tracking-[-0.02em] text-balance text-white sm:text-8xl lg:text-9xl">
              Un respiro para tu piel
            </h1>
          </Revelar>

          <Revelar retardo={120} className="mt-10 max-w-xl">
            <p className="text-base leading-[1.7] text-pretty text-tienda-tenue">
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
                <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-5xl">
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

        {/*
          Por qué se hace así. Es el equivalente al bloque de filosofía de
          la referencia, pero con lo que LILUS tiene de verdad: el material
          sale de LILUS-AUDIOVISUAL/01-estrategia/el-angulo.md.
        */}
        <section className="pb-[120px]">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Revelar variante="enfocar">
              <h2 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] text-balance text-white sm:text-7xl">
                El arte de no gritar
              </h2>
            </Revelar>

            <Revelar retardo={100} className="space-y-6 self-end">
              <p className="text-base leading-[1.7] text-pretty text-tienda-tenue">
                Trabajamos con glicerina, no con jabón en frío. La glicerina deja
                pasar la luz: se ve el café en suspensión, los pétalos, las
                capas. Cuesta más y es más delicada, y se puede ver lo que hay
                dentro — que es exactamente lo que queremos.
              </p>
              <p className="text-base leading-[1.7] text-pretty text-tienda-tenue">
                Cada barra lleva su lote y su fecha impresos. No porque quede
                bonito, sino porque si algo sale mal queremos saber de qué tanda
                salió.
              </p>
              <Link
                href="/nosotros"
                className="inline-block text-sm text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
              >
                Cómo trabajamos
              </Link>
            </Revelar>
          </div>
        </section>
      </div>

      {/*
        El carrusel va a sangre, sin el margen del contenido: la fila tiene
        que salirse por los dos lados para que se lea como algo que sigue
        más allá de la pantalla.
      */}
      {productos.length > 0 && (
        <section className="pb-[120px]">
          <div className="mx-auto mb-12 max-w-[1440px] px-6 sm:px-10">
            <Revelar>
              <h2 className="font-display text-4xl leading-none tracking-[-0.02em] text-white sm:text-5xl">
                Y todo lo demás
              </h2>
              <p className="mt-3 max-w-md text-sm text-tienda-tenue">
                Jabones sueltos, cremas, perfumes y cuidado del cabello.
              </p>
            </Revelar>
          </div>

          <Revelar>
            <CarruselProductos articulos={productos} />
          </Revelar>

          <div className="mx-auto mt-12 max-w-[1440px] px-6 sm:px-10">
            <Revelar>
              <Boton href="/tienda">Ver el catálogo completo</Boton>
            </Revelar>
          </div>
        </section>
      )}

      <Revelar>
        <CintaTexto texto="Hecho a mano, de a poco." />
        <div className="mx-auto max-w-[1440px] px-6 text-center sm:px-10">
          <Link
            href="/nosotros"
            className="text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
          >
            Conoce el taller
          </Link>
        </div>
      </Revelar>
    </>
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
        <p className="mt-1.5 text-sm leading-snug text-pretty text-tienda-tenue">
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
