import Link from "next/link";
import { listarCatalogo, type ArticuloResumen } from "@/lib/tienda";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { BotonAgregar } from "@/components/tienda/boton-agregar";

/**
 * El catálogo.
 *
 * Los packs van arriba porque es lo que conviene que se lleven: salen más
 * baratos que comprar lo mismo suelto y son una mejor primera compra que
 * un jabón de cuatro dólares al que hay que sumarle tres cincuenta de
 * envío.
 */

// El catálogo cambia cuando la dueña publica algo, no en cada visita.
// Media hora de cache es invisible para ella y le ahorra a la laptop
// consultar la base en cada persona que entra.
export const revalidate = 1800;

export default async function Catalogo() {
  const { packs, productos } = await listarCatalogo();
  const vacio = packs.length === 0 && productos.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="py-16 sm:py-24 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-balance">
          Jabones hechos a mano, uno por uno
        </h1>
        <p className="mt-5 text-stone-600 leading-relaxed text-pretty">
          Trabajamos con glicerina vegetal, aceites y recetas propias que se
          fueron corrigiendo con los años. Cada barra se corta y se etiqueta a
          mano, con su lote y su fecha.
        </p>
      </section>

      {vacio ? (
        <SinCatalogo />
      ) : (
        <>
          {packs.length > 0 && (
            <Seccion
              titulo="Packs"
              nota="Salen mejor que comprar lo mismo por separado."
              articulos={packs}
            />
          )}
          {productos.length > 0 && (
            <Seccion titulo="Productos" articulos={productos} />
          )}
        </>
      )}
    </div>
  );
}

function Seccion({
  titulo,
  nota,
  articulos,
}: {
  titulo: string;
  nota?: string;
  articulos: ArticuloResumen[];
}) {
  return (
    <section className="mb-20">
      <div className="mb-6">
        <h2 className="text-xl font-medium tracking-tight">{titulo}</h2>
        {nota && <p className="mt-1 text-sm text-stone-500">{nota}</p>}
      </div>

      <ul className="grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-3">
        {articulos.map((a, i) => (
          <li key={`${a.tipo}:${a.id}`}>
            <Tarjeta articulo={a} prioridad={i < 3} />
          </li>
        ))}
      </ul>
    </section>
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
    <article className="flex flex-col h-full">
      {/*
        La foto y el nombre son un solo enlace. Que sean dos destinos
        distintos hacia el mismo sitio no ayuda a nadie y estorba a quien
        navega con teclado o lector de pantalla.
      */}
      <Link href={`/${articulo.slug}`} className="group">
        <div className="relative aspect-square overflow-hidden rounded-lg bg-stone-100">
          <ImagenArticulo
            url={articulo.imagen}
            alt={articulo.imagenAlt}
            nombre={articulo.nombre}
            prioridad={prioridad}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <h3 className="mt-3 font-medium leading-snug group-hover:underline underline-offset-4 decoration-stone-300">
          {articulo.nombre}
        </h3>
      </Link>

      {articulo.tagline && (
        <p className="mt-1 text-sm text-stone-500 leading-snug text-pretty">
          {articulo.tagline}
        </p>
      )}

      {/* mt-auto: los botones quedan alineados aunque los textos midan distinto. */}
      <div className="mt-auto pt-4 flex items-center justify-between gap-3">
        <span className="tabular-nums">{formatCurrency(articulo.precio)}</span>
        <BotonAgregar articulo={articulo} />
      </div>
    </article>
  );
}

/**
 * Nada publicado todavía.
 *
 * Pasa cuando la tienda está montada pero la dueña aún no marcó nada como
 * público. Es un estado real y transitorio, no un error, así que se dice
 * en voz normal en vez de mostrar una pantalla rota.
 */
function SinCatalogo() {
  return (
    <div className="py-16 border-t border-stone-200">
      <p className="text-stone-600">
        Estamos terminando de preparar el catálogo. Mientras tanto seguimos
        tomando pedidos por WhatsApp e Instagram, como siempre.
      </p>
    </div>
  );
}
