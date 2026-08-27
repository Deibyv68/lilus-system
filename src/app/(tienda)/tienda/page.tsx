import { listarCatalogo, type ArticuloResumen } from "@/lib/tienda";
import { Revelar } from "@/components/tienda/revelar";
import { TarjetaArticulo } from "@/components/tienda/tarjeta-articulo";

/**
 * El catálogo.
 *
 * Los packs van arriba porque es lo que conviene que se lleven: salen más
 * baratos que comprar lo mismo suelto y son una mejor primera compra que
 * un jabón de cuatro dólares al que hay que sumarle tres cincuenta de
 * envío.
 *
 * El ritmo vertical sale de la plantilla de referencia: 200 px de aire en
 * la portada y 120 px entre secciones. Es mucho más de lo que uno pondría
 * por instinto, y es justo lo que hace que se vea caro.
 */

export const revalidate = 1800;

export default async function Catalogo() {
  const { packs, productos } = await listarCatalogo();
  const vacio = packs.length === 0 && productos.length === 0;

  return (
    <div className="mx-auto max-w-[1440px] px-6 sm:px-10">
      <section className="py-[120px] sm:py-[200px]">
        <Revelar className="max-w-3xl">
          <h1 className="font-display text-6xl sm:text-8xl leading-[0.95] tracking-[-0.02em] text-white text-balance">
            Un respiro para tu piel
          </h1>
          <p className="mt-8 max-w-xl text-base leading-[1.6] tracking-[-0.01em] text-tienda-tenue text-pretty">
            Trabajamos con glicerina vegetal, aceites y recetas propias que se
            fueron corrigiendo con los años. Cada barra se corta y se etiqueta a
            mano, con su lote y su fecha.
          </p>
        </Revelar>
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
            <TarjetaArticulo articulo={a} prioridad={i < 3} />
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
function SinCatalogo() {
  return (
    <div className="border-t border-tienda-linea py-20">
      <p className="text-tienda-tenue">
        Estamos terminando de preparar el catálogo. Mientras tanto seguimos
        tomando pedidos por WhatsApp e Instagram, como siempre.
      </p>
    </div>
  );
}
