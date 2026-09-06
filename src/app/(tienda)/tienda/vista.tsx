import Link from "next/link";
import { filtrar } from "@/lib/buscar";
import type { ArticuloResumen } from "@/lib/tienda";
import { Revelar } from "@/components/tienda/revelar";
import { TarjetaArticulo } from "@/components/tienda/tarjeta-articulo";

/**
 * El catálogo dibujado, con o sin búsqueda aplicada.
 *
 * Está separado de la página porque lo usan dos: el servidor lo pinta
 * entero durante la compilación —para que el HTML que llega traiga los
 * productos, no un hueco— y el cliente lo vuelve a pintar filtrado cuando
 * la URL trae `?q=`.
 *
 * No lleva «use client» a propósito: así el servidor puede usarlo y el
 * cliente también. Lo único que importa de `@/lib/tienda` es un tipo, que
 * se borra al compilar, y por eso esto no arrastra la base de datos al
 * navegador.
 */
export function Vista({
  packs,
  productos,
  busqueda,
}: {
  packs: ArticuloResumen[];
  productos: ArticuloResumen[];
  busqueda: string;
}) {
  // La misma función que usa la capa del buscador, para que escribir lo
  // mismo aquí y allá dé exactamente lo mismo.
  const packsVisibles = filtrar(packs, busqueda);
  const productosVisibles = filtrar(productos, busqueda);
  const vacio = packsVisibles.length === 0 && productosVisibles.length === 0;
  const cuantos = packsVisibles.length + productosVisibles.length;

  return (
    <>
      <section className="py-[120px] sm:py-[200px]">
        <Revelar className="max-w-3xl">
          <h1 className="font-display text-6xl sm:text-8xl leading-[0.95] tracking-[-0.02em] text-white text-balance">
            {busqueda ? `«${busqueda}»` : "Un respiro para tu piel"}
          </h1>
          <p className="mt-8 max-w-xl text-base leading-[1.6] tracking-[-0.01em] text-tienda-tenue text-pretty">
            {busqueda
              ? `${cuantos} resultado${cuantos === 1 ? "" : "s"}.`
              : "Trabajamos con glicerina vegetal, aceites y recetas propias que se fueron corrigiendo con los años. Cada barra se corta y se etiqueta a mano, con su lote y su fecha."}
          </p>
          {busqueda && (
            <Link
              href="/tienda"
              className="mt-6 inline-block py-2 text-sm text-tienda-tenue underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-texto"
            >
              Ver todo el catálogo
            </Link>
          )}
        </Revelar>
      </section>

      {vacio ? (
        <SinCatalogo busqueda={busqueda} />
      ) : (
        <>
          {packsVisibles.length > 0 && (
            <Seccion
              titulo="Packs"
              nota="Salen mejor que comprar lo mismo por separado."
              articulos={packsVisibles}
              busqueda={busqueda}
            />
          )}
          {productosVisibles.length > 0 && (
            <Seccion
              titulo="Productos"
              articulos={productosVisibles}
              busqueda={busqueda}
            />
          )}
        </>
      )}
    </>
  );
}

function Seccion({
  titulo,
  nota,
  articulos,
  busqueda,
}: {
  titulo: string;
  nota?: string;
  articulos: ArticuloResumen[];
  /** Para que cada tarjeta pueda decir por qué salió. */
  busqueda?: string;
}) {
  return (
    <section className="pb-[120px]">
      <Revelar className="mb-12">
        <h2 className="font-display text-4xl sm:text-5xl leading-none tracking-[-0.02em] text-white">
          {titulo}
        </h2>
        {nota && <p className="mt-3 text-sm text-tienda-tenue">{nota}</p>}
      </Revelar>

      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14">
        {articulos.map((a, i) => (
          <Revelar
            as="li"
            key={`${a.tipo}:${a.id}`}
            /*
              El escalonado va por columna y no por posición absoluta: la
              fila entra casi junta, con un desfase corto de izquierda a
              derecha. Escalonar los treinta artículos en cadena haría que
              el último tardara segundos en aparecer.
            */
            retardo={(i % 3) * 80}
            className="min-w-0"
          >
            <TarjetaArticulo articulo={a} prioridad={i < 3} consulta={busqueda} />
          </Revelar>
        ))}
      </ul>
    </section>
  );
}

/**
 * Nada publicado todavía.
 *
 * Pasa cuando la tienda está montada pero la dueña aún no marcó nada como
 * público. Es un estado real y transitorio, no un error, así que se dice
 * en voz normal en vez de mostrar una pantalla rota.
 */
function SinCatalogo({ busqueda }: { busqueda: string }) {
  return (
    <div className="border-t border-tienda-linea py-20">
      <p className="text-tienda-tenue">
        {busqueda
          ? "No encontramos nada con esa palabra. Prueba con el nombre del jabón o del ingrediente."
          : "Estamos terminando de preparar el catálogo. Mientras tanto seguimos tomando pedidos por WhatsApp e Instagram, como siempre."}
      </p>
    </div>
  );
}
