/**
 * Lo que la tienda le puede preguntar a la base.
 *
 * Todo lo que sale de aquí es público: lo va a ver cualquiera que entre a
 * la web. Por eso las consultas eligen columna por columna en vez de traer
 * la fila entera. El costo de producción, el stock y el margen viven en la
 * misma tabla que el nombre y el precio, y basta un `include` distraído
 * para que terminen en el HTML que se manda al navegador.
 *
 * Productos y packs son dos tablas distintas pero en la tienda son la
 * misma cosa: algo con foto, nombre y precio que se puede meter al
 * carrito. Se normalizan aquí, y de aquí para arriba nadie tiene que
 * volver a preguntarse cuál de los dos es.
 */

import { prisma } from "./prisma";

export type TipoArticulo = "producto" | "pack";

export type ArticuloResumen = {
  tipo: TipoArticulo;
  id: string;
  slug: string;
  nombre: string;
  tagline: string | null;
  precio: number;
  imagen: string | null;
  imagenAlt: string | null;
};

export type ArticuloDetalle = ArticuloResumen & {
  descripcion: string | null;
  ingredientes: string | null;
  imagenes: { url: string; alt: string | null }[];
  /** Solo en packs: qué trae adentro. */
  contenido: { nombre: string; cantidad: number; slug: string | null }[];
};

/** Columnas que se pueden mostrar. El resto no sale de la base. */
const RESUMEN = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  price: true,
  storeImages: {
    orderBy: { sortOrder: "asc" },
    take: 1,
    select: { url: true, alt: true },
  },
} as const;

/**
 * Un artículo se muestra si está publicado Y sigue activo.
 *
 * Son dos interruptores distintos y hacen falta los dos: `isActive` es
 * «esto todavía se vende», `isPublic` es «esto se muestra en la web».
 * Algo que se dio de baja no debería seguir apareciendo solo porque
 * alguien se olvidó de despublicarlo.
 */
const VISIBLE = { isPublic: true, isActive: true, slug: { not: null } };

function aResumen(
  tipo: TipoArticulo,
  fila: {
    id: string;
    slug: string | null;
    name: string;
    tagline: string | null;
    price: number;
    storeImages: { url: string; alt: string | null }[];
  }
): ArticuloResumen {
  return {
    tipo,
    id: fila.id,
    slug: fila.slug!,
    nombre: fila.name,
    tagline: fila.tagline,
    precio: fila.price,
    imagen: fila.storeImages[0]?.url ?? null,
    imagenAlt: fila.storeImages[0]?.alt ?? null,
  };
}

/** El catálogo completo. Los packs primero: son la mejor puerta de entrada. */
export async function listarCatalogo(): Promise<{
  packs: ArticuloResumen[];
  productos: ArticuloResumen[];
}> {
  const [packs, productos] = await Promise.all([
    prisma.pack.findMany({ where: VISIBLE, select: RESUMEN, orderBy: { price: "asc" } }),
    prisma.product.findMany({ where: VISIBLE, select: RESUMEN, orderBy: { name: "asc" } }),
  ]);

  return {
    packs: packs.map((p) => aResumen("pack", p)),
    productos: productos.map((p) => aResumen("producto", p)),
  };
}

/**
 * Busca por dirección pública. Devuelve null si no existe o no está
 * publicado — la tienda responde 404 en los dos casos, que es lo correcto:
 * un artículo despublicado no tiene por qué anunciar que existe.
 */
export async function buscarPorSlug(slug: string): Promise<ArticuloDetalle | null> {
  const detalle = {
    ...RESUMEN,
    description: true,
    storeImages: {
      orderBy: { sortOrder: "asc" },
      select: { url: true, alt: true },
    },
  } as const;

  const producto = await prisma.product.findFirst({
    where: { ...VISIBLE, slug },
    select: { ...detalle, ingredients: true },
  });

  if (producto) {
    return {
      ...aResumen("producto", producto),
      descripcion: producto.description,
      ingredientes: producto.ingredients,
      imagenes: producto.storeImages,
      contenido: [],
    };
  }

  const pack = await prisma.pack.findFirst({
    where: { ...VISIBLE, slug },
    select: {
      ...detalle,
      items: {
        select: {
          quantity: true,
          product: { select: { name: true, slug: true, isPublic: true } },
        },
      },
    },
  });

  if (!pack) return null;

  return {
    ...aResumen("pack", pack),
    descripcion: pack.description,
    ingredientes: null,
    imagenes: pack.storeImages,
    contenido: pack.items.map((i) => ({
      nombre: i.product.name,
      cantidad: i.quantity,
      // Solo se enlaza lo que también está publicado. Un enlace a un
      // producto despublicado lleva a un 404, y eso parece un error del
      // sitio aunque no lo sea.
      slug: i.product.isPublic ? i.product.slug : null,
    })),
  };
}

/**
 * Los precios que valen. Se usa al armar el pedido.
 *
 * El carrito vive en el navegador del cliente, así que los precios que
 * manda son un dato de entrada, no una verdad: cualquiera puede editarlos
 * antes de enviar. Lo único que se acepta de ahí es qué artículo y cuántos;
 * cuánto cuesta se vuelve a leer de la base, siempre.
 */
export async function preciosVigentes(
  refs: { tipo: TipoArticulo; id: string }[]
): Promise<Map<string, { nombre: string; precio: number }>> {
  const idsProducto = refs.filter((r) => r.tipo === "producto").map((r) => r.id);
  const idsPack = refs.filter((r) => r.tipo === "pack").map((r) => r.id);

  const [productos, packs] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: idsProducto }, ...VISIBLE },
      select: { id: true, name: true, price: true },
    }),
    prisma.pack.findMany({
      where: { id: { in: idsPack }, ...VISIBLE },
      select: { id: true, name: true, price: true },
    }),
  ]);

  const mapa = new Map<string, { nombre: string; precio: number }>();
  for (const p of productos) mapa.set(`producto:${p.id}`, { nombre: p.name, precio: p.price });
  for (const p of packs) mapa.set(`pack:${p.id}`, { nombre: p.name, precio: p.price });
  return mapa;
}
