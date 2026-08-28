import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { ImagenArticulo } from "@/components/tienda/imagen-articulo";
import { Revelar } from "@/components/tienda/revelar";
import { Continuar } from "./continuar";

export const dynamic = "force-dynamic";

/**
 * El enlace que manda quien vende para que la clienta termine el pedido.
 *
 * ── Qué hace, y qué no ──
 *
 * No es otro checkout. Enseña lo acordado, y al continuar deja eso en el
 * carrito y lleva al checkout de siempre — el que valida la cédula,
 * deduce el cantón, saca el punto del mapa y calcula el envío.
 *
 * Escribir aquí un segundo formulario habría significado dos sitios donde
 * se valida una dirección, y el día que uno cambie el otro se queda
 * atrás. Con esto hay una sola forma de comprar en LILUS; el enlace solo
 * decide con qué llega uno.
 *
 * ── Por qué hay un botón y no una redirección ──
 *
 * Porque continuar reemplaza el carrito de quien abre. Hacerlo al cargar
 * la página le borraría en silencio lo que estuviera guardado, y encima
 * sin haberle enseñado qué recibe a cambio.
 */
export default async function Pedir({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const borrador = await prisma.borradorDePedido.findUnique({
    where: { token },
    include: { items: true, order: { select: { publicToken: true } } },
  });

  if (!borrador) return <Aviso titulo="Este enlace no existe" />;

  if (borrador.usadoEn) {
    return (
      <Aviso titulo="Este enlace ya se usó">
        {borrador.order?.publicToken ? (
          <>
            El pedido ya está hecho.{" "}
            <Enlace href={`/pedido/${borrador.order.publicToken}`}>
              Míralo aquí
            </Enlace>
            .
          </>
        ) : (
          <>Si necesitas otro, escríbenos y te lo mandamos.</>
        )}
      </Aviso>
    );
  }

  if (borrador.expiraEn < new Date()) {
    return (
      <Aviso titulo="Este enlace ya caducó">
        Duran dos días. Escríbenos y te mandamos uno nuevo.
      </Aviso>
    );
  }

  /*
    Los artículos se leen AHORA, no se guardan copiados en el borrador.

    Entre que se manda el enlace y se abre pueden pasar dos días: un
    precio puede cambiar, o algo puede despublicarse. Enseñar el precio de
    anteayer sería prometer lo que no se va a cobrar — el checkout relee
    los precios igualmente, y entonces la clienta vería una cifra en el
    enlace y otra al pagar.
  */
  const idsProducto = borrador.items.filter((i) => i.tipo === "producto").map((i) => i.refId);
  const idsPack = borrador.items.filter((i) => i.tipo === "pack").map((i) => i.refId);
  const VISIBLE = { isPublic: true, isActive: true, slug: { not: null } };
  const SELECT = {
    id: true,
    slug: true,
    name: true,
    price: true,
    imageUrl: true,
    storeImages: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
  } as const;

  const [productos, packs] = await Promise.all([
    idsProducto.length
      ? prisma.product.findMany({ where: { id: { in: idsProducto }, ...VISIBLE }, select: SELECT })
      : [],
    idsPack.length
      ? prisma.pack.findMany({ where: { id: { in: idsPack }, ...VISIBLE }, select: SELECT })
      : [],
  ]);

  const lineas = borrador.items
    .map((i) => {
      const fila =
        i.tipo === "producto"
          ? productos.find((p) => p.id === i.refId)
          : packs.find((p) => p.id === i.refId);
      if (!fila) return null;
      return {
        tipo: i.tipo as "producto" | "pack",
        id: fila.id,
        slug: fila.slug!,
        nombre: fila.name,
        precio: fila.price,
        imagen: fila.storeImages[0]?.url ?? fila.imageUrl ?? null,
        cantidad: i.cantidad,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const total = lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
  const seCayoAlguno = lineas.length < borrador.items.length;

  return (
    <div className="mx-auto max-w-xl px-5 py-12 sm:py-20">
      <Revelar>
        <h1 className="font-display text-[clamp(2.5rem,9vw,4rem)] leading-[0.95] tracking-[-0.03em] text-white">
          {lineas.length > 0 ? "Tu pedido" : "Arma tu pedido"}
        </h1>
        <p className="mt-5 text-sm leading-relaxed text-tienda-tenue">
          {lineas.length > 0
            ? "Esto es lo que apartamos para ti. Solo faltan tus datos de entrega."
            : "Elige lo que quieras del catálogo y déjanos tus datos de entrega."}
        </p>
      </Revelar>

      {lineas.length > 0 && (
        <Revelar retardo={80} className="mt-10">
          <ul className="divide-y divide-tienda-linea border-y border-tienda-linea">
            {lineas.map((l) => (
              <li key={`${l.tipo}:${l.id}`} className="flex items-center gap-4 py-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-tienda-sm bg-tienda-velo">
                  <ImagenArticulo url={l.imagen} alt={null} nombre={l.nombre} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-tienda-texto">{l.nombre}</span>
                  <span className="block text-xs text-tienda-tenue">
                    {l.cantidad} × {formatCurrency(l.precio)}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-tienda-texto">
                  {formatCurrency(l.precio * l.cantidad)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-tienda-tenue">Productos</span>
            <span className="font-display text-2xl text-white">
              {formatCurrency(total)}
            </span>
          </p>
          <p className="mt-1 text-xs text-tienda-tenue">
            El envío se calcula con tu dirección, en el siguiente paso.
          </p>
        </Revelar>
      )}

      {seCayoAlguno && (
        <p className="mt-6 rounded-tienda-sm border border-tienda-linea px-4 py-3 text-sm leading-relaxed text-tienda-tenue">
          Algo de lo que habíamos apartado ya no está disponible y lo
          quitamos. Puedes seguir con el resto, o escribirnos.
        </p>
      )}

      <Revelar retardo={140} className="mt-10">
        <Continuar token={token} lineas={lineas} />
      </Revelar>
    </div>
  );
}

function Aviso({
  titulo,
  children,
}: {
  titulo: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-display text-4xl leading-tight text-white">{titulo}</h1>
      {children && (
        <p className="mt-5 text-sm leading-relaxed text-tienda-tenue">{children}</p>
      )}
      <p className="mt-8">
        <Enlace href="/tienda">Ver el catálogo</Enlace>
      </p>
    </div>
  );
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-tienda-texto underline underline-offset-4 transition-colors duration-[400ms] ease-tienda hover:text-tienda-acento"
    >
      {children}
    </Link>
  );
}
